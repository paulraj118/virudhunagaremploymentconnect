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
    const body = await request.json().catch(() => ({}));
    const { remarks } = body;

    // Status Transition Guard
    const nonCancellable = ['Completed', 'Selected', 'Rejected'];
    if (nonCancellable.includes(interview.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot cancel interview with current status: ${interview.status}`, errors: ['Invalid status transition'] },
        { status: 400 }
      );
    }

    const previousStatus = interview.status;

    // Apply updates
    interview.status = 'Cancelled';

    // Timeline Log
    interview.timeline.push({
      status: 'Cancelled',
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || 'Interview cancelled by HR'
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Update parent JobApplication stage
    const jobApp = await JobApplication.findById(interview.applicationId);
    if (jobApp) {
      jobApp.stage = 'Applied'; // reset stage
      await jobApp.save();
    }

    // Record Audit Trail
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus: 'Cancel Interview',
      remarks: remarks || 'Interview cancelled by HR'
    });

    // Notify Candidate
    const companyName = company?.companyName || 'Company';
    await Notification.create({
      recipientId: interview.candidateId.toString(),
      recipientRole: 'student',
      message: `Your interview with ${companyName} has been cancelled.`,
      type: 'interview_cancelled',
      link: '/student/interviews'
    });

    return NextResponse.json({
      success: true,
      message: 'Interview cancelled successfully',
      data: interview
    });

  } catch (error) {
    console.error('[INTERVIEW_CANCEL] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
