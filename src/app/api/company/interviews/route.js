import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Interview from '@/models/Interview';
import DriveApplication from '@/models/DriveApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';
import Student from '@/models/Student';
import User from '@/models/User';
import Company from '@/models/Company';
import JobApplication from '@/models/JobApplication';
import Job from '@/models/Job';

function generateInterviewId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'INT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - HR Interview List
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Access denied.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    await dbConnect();

    // Legacy College Placement Drive Company Flow
    if (decoded.role === 'company') {
      const interviews = await Interview.find({ companyId: decoded.id })
        .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', model: User, select: 'name email' } })
        .populate('driveId', 'jobRole')
        .sort({ date: 1 })
        .lean();
      return NextResponse.json({ success: true, message: 'Legacy interviews retrieved', data: interviews });
    }

    // Unified Job Portal HR Flow
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company profile not found', errors: ['Linked company not found'] },
          { status: 404 }
        );
      }

      const { searchParams } = new URL(request.url);
      const statusFilter = searchParams.get('status');

      const filter = { companyId: company._id };
      if (statusFilter) {
        filter.status = statusFilter;
      }

      const interviews = await Interview.find(filter)
        .populate('candidateId', 'name email gender')
        .populate({
          path: 'applicationId',
          select: 'studentId',
          populate: { path: 'studentId', select: 'collegeName' }
        })
        .populate('jobId', 'title role')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        message: 'Interviews retrieved successfully',
        data: interviews
      });
    }

    return NextResponse.json(
      { success: false, message: 'Forbidden: Invalid role', errors: ['Insufficient permissions'] },
      { status: 403 }
    );
  } catch (error) {
    console.error('[INTERVIEWS] Fetch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}

// POST - Schedule Interview / Save Draft
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'company' && decoded.role !== 'hr_company')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Access denied.', errors: ['Authentication failed'] },
        { status: 401 }
      );
    }

    const data = await request.json();
    await dbConnect();

    // Legacy College Placement Drive Company Flow
    if (decoded.role === 'company') {
      const app = await DriveApplication.findById(data.applicationId);
      if (!app || app.companyId.toString() !== decoded.id) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Access denied.', errors: ['Application ownership validation failed'] },
          { status: 403 }
        );
      }

      const interview = await Interview.create({
        ...data,
        companyId: decoded.id,
        driveId: app.driveId,
        studentId: app.studentId,
        status: 'Scheduled',
        createdBy: decoded.id
      });

      if (app.status === 'Company Shortlisted') {
        app.status = 'Interview Scheduled';
        app.interviewDate = new Date(`${data.date}T${data.startTime}`);
        app.interviewLocation = data.mode === 'Online' ? data.meetingLink : data.venue;
        await app.save();
      }

      await AuditTrail.create({
        applicationId: app._id,
        actorId: decoded.id,
        actorRole: 'company',
        previousStatus: app.status,
        newStatus: 'Interview Scheduled',
        remarks: `Interview Type: ${data.type} scheduled for ${data.date}.`
      });

      await Notification.create({
        recipientId: app.studentId.toString(),
        recipientRole: 'student',
        message: `An interview (${data.type}) has been scheduled by the company.`,
        type: 'interview_update',
        link: '/student/interviews'
      });

      return NextResponse.json({
        success: true,
        message: 'Legacy interview scheduled successfully',
        data: interview
      });
    }

    // Unified Job Portal HR Flow
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company profile not found', errors: ['Linked company not found'] },
          { status: 404 }
        );
      }

      const {
        candidateId,
        jobId,
        applicationId,
        assessmentResultId,
        technicalAttemptId,
        interviewType,
        interviewRound,
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
        status, // Draft or Scheduled
        attachments
      } = data;

      // Validate required fields
      if (
        !candidateId ||
        !jobId ||
        !applicationId ||
        !interviewType ||
        !interviewRound ||
        !interviewDate ||
        !interviewTime ||
        !duration ||
        !interviewMode ||
        !interviewerName ||
        !interviewerEmail
      ) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields.', errors: ['Check all required interview details'] },
          { status: 400 }
        );
      }

      // Verify company ownership of the JobApplication
      const jobApp = await JobApplication.findOne({ _id: applicationId, companyId: company._id });
      if (!jobApp) {
        return NextResponse.json(
          { success: false, message: 'Job Application not found or unauthorized.', errors: ['Ownership validation failed'] },
          { status: 403 }
        );
      }

      const interviewId = generateInterviewId();
      const finalStatus = status || 'Scheduled'; // Defaults to Scheduled

      const interview = await Interview.create({
        interviewId,
        companyId: company._id,
        hrId: decoded.id,
        candidateId,
        jobId,
        applicationId,
        assessmentResultId: assessmentResultId || undefined,
        technicalAttemptId: technicalAttemptId || undefined,
        interviewType,
        interviewRound,
        interviewDate: new Date(interviewDate),
        interviewTime,
        duration: Number(duration),
        timezone: timezone || 'UTC',
        interviewMode,
        meetingLink: interviewMode === 'Online' ? meetingLink : undefined,
        meetingPlatform: interviewMode === 'Online' ? meetingPlatform : undefined,
        venue: interviewMode === 'Offline' ? venue : undefined,
        venueAddress: interviewMode === 'Offline' ? venueAddress : undefined,
        interviewerName,
        interviewerEmail,
        interviewerDesignation,
        interviewInstructions,
        status: finalStatus,
        confirmationStatus: 'Pending',
        attachments: attachments || [],
        createdBy: decoded.id,
        timeline: [
          {
            status: finalStatus,
            timestamp: new Date(),
            actorId: decoded.id,
            actorRole: decoded.role,
            remarks: `Interview created as status: ${finalStatus}`
          }
        ]
      });

      // Update JobApplication stage and details if Scheduled
      if (finalStatus === 'Scheduled') {
        jobApp.stage = 'Interview Scheduled';
        jobApp.interviewDate = new Date(interviewDate);
        if (meetingLink) jobApp.meetingLink = meetingLink;
        await jobApp.save();

        // Create Notification for candidate
        try {
          await Notification.create({
            recipientId: candidateId,
            recipientRole: 'student',
            message: `An interview round (${interviewRound}) has been scheduled for ${company.companyName} on ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}.`,
            type: 'interview_scheduled',
            link: `/student/interviews`
          });
        } catch (notifErr) {
          console.error('[NOTIFICATION] Failed to notify candidate:', notifErr.message);
        }
      }

      // Record Audit Trail
      await AuditTrail.create({
        applicationId,
        actorId: decoded.id,
        actorRole: decoded.role,
        previousStatus: 'None',
        newStatus: finalStatus === 'Draft' ? 'Draft Created' : 'Schedule Interview',
        remarks: `Interview round ${interviewRound} ${finalStatus === 'Draft' ? 'saved as Draft' : 'scheduled'} for ${interviewDate}.`
      });

      return NextResponse.json({
        success: true,
        message: finalStatus === 'Draft' ? 'Interview saved as draft successfully' : 'Interview scheduled successfully',
        data: interview
      });
    }

    return NextResponse.json(
      { success: false, message: 'Forbidden: Invalid role', errors: ['Insufficient permissions'] },
      { status: 403 }
    );
  } catch (error) {
    console.error('[INTERVIEWS] Creation Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message, errors: [error.message] },
      { status: 500 }
    );
  }
}
