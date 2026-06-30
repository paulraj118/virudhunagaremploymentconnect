import { NextResponse } from 'next/server';
import { validateHRInterviewAccess } from '@/lib/interviewAuth';
import JobApplication from '@/models/JobApplication';
import AuditTrail from '@/models/AuditTrail';
import Notification from '@/models/Notification';

export async function POST(request, { params }) {
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
      remarks
    } = body;

    if (!interviewDate || !interviewTime) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: interviewDate and interviewTime are required.' },
        { status: 400 }
      );
    }

    // Status Transition Guard
    const nonReschedulable = ['Selected', 'Rejected', 'Completed'];
    if (nonReschedulable.includes(interview.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot reschedule interview with current status: ${interview.status}`, errors: ['Invalid status transition'] },
        { status: 400 }
      );
    }

    const previousStatus = interview.status;

    // Apply updates
    interview.interviewDate = new Date(interviewDate);
    interview.interviewTime = interviewTime;
    interview.status = 'Rescheduled';
    interview.confirmationStatus = 'Pending'; // resets confirmation to pending
    
    // Optional updates
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

    // Reset reminder flags so they fire for the rescheduled time
    interview.reminder24hSent = false;
    interview.reminder1hSent = false;

    // Timeline Log
    interview.timeline.push({
      status: 'Rescheduled',
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || `Interview rescheduled to ${interviewDate} at ${interviewTime}`
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Update parent JobApplication
    const jobApp = await JobApplication.findById(interview.applicationId);
    if (jobApp) {
      jobApp.interviewDate = new Date(interviewDate);
      if (meetingLink) jobApp.meetingLink = meetingLink;
      await jobApp.save();
    }

    // Record Audit Trail
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus: 'Reschedule Interview',
      remarks: remarks || `Interview rescheduled to ${interviewDate} at ${interviewTime}`
    });

    // Notify Candidate
    const companyName = company?.companyName || 'Company';
    await Notification.create({
      recipientId: interview.candidateId.toString(),
      recipientRole: 'student',
      message: `Your interview with ${companyName} has been rescheduled to ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}.`,
      type: 'interview_rescheduled',
      link: '/student/interviews'
    });

    return NextResponse.json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: interview
    });

  } catch (error) {
    console.error('[INTERVIEW_RESCHEDULE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
