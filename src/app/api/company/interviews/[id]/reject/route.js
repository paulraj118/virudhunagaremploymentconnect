import { NextResponse } from 'next/server';
import { validateHRInterviewAccess } from '@/lib/interviewAuth';
import { calculateAndSyncOverallScore } from '@/lib/scoreRanking';
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
    if (interview.status === 'Cancelled') {
      return NextResponse.json(
        { success: false, message: 'Cannot make final decision on a cancelled interview.', errors: ['Invalid status transition'] },
        { status: 400 }
      );
    }

    const previousStatus = interview.status;

    // Apply updates
    interview.status = 'Rejected';

    // Timeline Log
    interview.timeline.push({
      status: 'Rejected',
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || 'Candidate rejected after interview'
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Update parent JobApplication status/stage
    const jobApp = await JobApplication.findById(interview.applicationId);
    if (jobApp) {
      jobApp.stage = 'Rejected';
      jobApp.finalDecision = 'Rejected';
      await jobApp.save();

      // Recalculate scores and rankings
      await calculateAndSyncOverallScore(interview.applicationId);
    }

    // Record Audit Trail
    await AuditTrail.create({
      applicationId: interview.applicationId,
      actorId: decoded.id,
      actorRole: decoded.role,
      previousStatus,
      newStatus: 'Final Decision',
      remarks: remarks || 'Final Decision - Rejected'
    });

    // Notify Candidate
    const companyName = company?.companyName || 'Company';
    await Notification.create({
      recipientId: interview.candidateId.toString(),
      recipientRole: 'student',
      message: `Thank you for participating. We regret to inform you that you have not been selected for the next rounds at ${companyName}.`,
      type: 'interview_rejected',
      link: '/student/interviews'
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate marked as rejected successfully',
      data: interview
    });

  } catch (error) {
    console.error('[INTERVIEW_REJECT] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
