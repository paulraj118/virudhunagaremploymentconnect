import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import JobApplication from '@/models/JobApplication';
import Job from '@/models/Job';
import { calculateAndSyncOverallScore } from '@/lib/scoreRanking';
import { validateHRInterviewAccess } from '@/lib/interviewAuth';

// GET - Single Interview details
export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Access denied.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    let interview = null;
    try {
      interview = await Interview.findById(id)
        .populate('candidateId', 'name email')
        .populate('jobId', 'title role')
        .populate('companyId', 'companyName website address');
    } catch (err) {
      if (err.name === 'CastError') {
        return NextResponse.json(
          { success: false, message: 'Invalid Interview ID format', errors: [`The ID '${id}' is not a valid ObjectId`] },
          { status: 400 }
        );
      }
      throw err;
    }

    if (!interview) {
      return NextResponse.json(
        { success: false, message: 'Interview not found', errors: [`No interview with ID ${id}`] },
        { status: 404 }
      );
    }

    // Security: Check if HR owns the company, or candidate owns the interview
    const candidateIdStr = interview.candidateId._id ? interview.candidateId._id.toString() : interview.candidateId.toString();
    const companyIdStr = interview.companyId._id ? interview.companyId._id.toString() : interview.companyId.toString();

    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company || company._id.toString() !== companyIdStr) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Interview does not belong to your company.', errors: ['Access denied'] },
          { status: 403 }
        );
      }
    } else if (decoded.role === 'student') {
      if (decoded.id !== candidateIdStr) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: You do not own this interview.', errors: ['Access denied'] },
          { status: 403 }
        );
      }
    } else if (decoded.role !== 'super_admin' && decoded.role !== 'company') {
      // Legacy company check
      if (decoded.id !== companyIdStr) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Access denied.', errors: ['Access denied'] },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Interview details retrieved successfully',
      data: interview
    });
  } catch (error) {
    console.error('[SINGLE_INTERVIEW] Fetch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}

// PUT - Update/Reschedule/Cancel Interview
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const authResult = await validateHRInterviewAccess(id);
    if (!authResult.success) {
      return NextResponse.json(authResult.payload, { status: authResult.status });
    }

    const { interview, decoded, company } = authResult;
    const body = await request.json();
    
    const {
      interviewDate,
      interviewTime,
      duration,
      timezone,
      interviewMode,
      meetingLink,
      meetingPlatform,
      venue,
      venueAddress,
      interviewerName,
      interviewerEmail,
      interviewerDesignation,
      interviewInstructions,
      status,
      confirmationStatus,
      attachments,
      actualStartTime,
      actualEndTime,
      completionPercentage,
      attendanceStatus,
      remarks
    } = body;

    const previousStatus = interview.status;

    // Apply general updates
    if (interviewDate) interview.interviewDate = new Date(interviewDate);
    if (interviewTime) interview.interviewTime = interviewTime;
    if (duration) interview.duration = Number(duration);
    if (timezone) interview.timezone = timezone;
    if (interviewMode) interview.interviewMode = interviewMode;
    if (meetingLink) interview.meetingLink = meetingLink;
    if (meetingPlatform) interview.meetingPlatform = meetingPlatform;
    if (venue) interview.venue = venue;
    if (venueAddress) interview.venueAddress = venueAddress;
    if (interviewerName) interview.interviewerName = interviewerName;
    if (interviewerEmail) interview.interviewerEmail = interviewerEmail;
    if (interviewerDesignation) interview.interviewerDesignation = interviewerDesignation;
    if (interviewInstructions) interview.interviewInstructions = interviewInstructions;
    if (confirmationStatus) interview.confirmationStatus = confirmationStatus;
    if (actualStartTime) interview.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) interview.actualEndTime = new Date(actualEndTime);
    if (completionPercentage !== undefined) interview.completionPercentage = Number(completionPercentage);
    if (attendanceStatus) interview.attendanceStatus = attendanceStatus;

    // Append attachments if passed
    if (attachments && Array.isArray(attachments)) {
      interview.attachments = [...interview.attachments, ...attachments];
    }

    let isStatusChanged = false;
    if (status && status !== previousStatus) {
      interview.status = status;
      isStatusChanged = true;
    }

    // Timeline Log
    const actionName = isStatusChanged ? `Status Updated to ${status}` : 'Details Updated';
    interview.timeline.push({
      status: status || previousStatus,
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || `Interview ${actionName}`
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Side-effects on parent JobApplication
    const jobApp = await JobApplication.findById(interview.applicationId);
    if (jobApp) {
      if (interviewDate) jobApp.interviewDate = new Date(interviewDate);
      if (meetingLink) jobApp.meetingLink = meetingLink;

      if (isStatusChanged) {
        if (status === 'Cancelled') {
          jobApp.stage = 'Applied';
        } else if (status === 'Selected') {
          jobApp.stage = 'Interview Cleared';
          jobApp.finalDecision = 'Selected';
        } else if (status === 'Rejected') {
          jobApp.stage = 'Rejected';
          jobApp.finalDecision = 'Rejected';
        } else if (status === 'Hold') {
          jobApp.finalDecision = 'Hold';
        }
      }
      await jobApp.save();

      // Recalculate scores if status changed to final states
      if (isStatusChanged && ['Selected', 'Rejected', 'Hold', 'Completed'].includes(status)) {
        await calculateAndSyncOverallScore(interview.applicationId);
      }
    }

    // Record Audit Trail
    const isFinalDecision = isStatusChanged && ['Selected', 'Rejected', 'Hold'].includes(status);
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus: isFinalDecision ? 'Final Decision' : 'Update Interview',
      remarks: remarks || `Interview updated: ${actionName}`
    });

    // Notify Candidate if status changed
    if (isStatusChanged) {
      try {
        const companyName = company?.companyName || 'Company';
        let notifMsg = `Your interview status has been updated to: ${status}.`;
        let notifType = 'interview_update';

        if (status === 'Rescheduled') {
          notifMsg = `Your interview with ${companyName} has been rescheduled to ${new Date(interview.interviewDate).toLocaleDateString()} at ${interview.interviewTime}.`;
          notifType = 'interview_rescheduled';
        } else if (status === 'Cancelled') {
          notifMsg = `Your interview with ${companyName} has been cancelled.`;
          notifType = 'interview_cancelled';
        } else if (status === 'Selected') {
          notifMsg = `Congratulations! You have been selected in the interview round (${interview.interviewRound}) for ${companyName}.`;
          notifType = 'interview_selected';
        } else if (status === 'Rejected') {
          notifMsg = `Thank you for participating. We regret to inform you that you have not been selected for the next rounds at ${companyName}.`;
          notifType = 'interview_rejected';
        }

        await Notification.create({
          recipientId: interview.candidateId.toString(),
          recipientRole: 'student',
          message: notifMsg,
          type: notifType,
          link: '/student/interviews'
        });
      } catch (notifErr) {
        console.error('[SINGLE_INTERVIEW] Candidate notification failed:', notifErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Interview updated successfully',
      data: interview
    });

  } catch (error) {
    console.error('[SINGLE_INTERVIEW] Update Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
