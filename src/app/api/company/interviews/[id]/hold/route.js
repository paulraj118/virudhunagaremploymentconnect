import { NextResponse } from 'next/server';
import { validateHRInterviewAccess } from '@/lib/interviewAuth';
import { calculateAndSyncOverallScore } from '@/lib/scoreRanking';
import JobApplication from '@/models/JobApplication';
import AuditTrail from '@/models/AuditTrail';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const authResult = await validateHRInterviewAccess(id);
    if (!authResult.success) {
      return NextResponse.json(authResult.payload, { status: authResult.status });
    }

    const { interview, decoded } = authResult;
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
    interview.status = 'Hold';

    // Timeline Log
    interview.timeline.push({
      status: 'Hold',
      timestamp: new Date(),
      actorId: decoded.id,
      actorRole: decoded.role,
      remarks: remarks || 'Candidate placed on Hold'
    });

    interview.updatedBy = decoded.id;
    await interview.save();

    // Update parent JobApplication
    const jobApp = await JobApplication.findById(interview.applicationId);
    if (jobApp) {
      jobApp.finalDecision = 'Hold';
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
      remarks: remarks || 'Final Decision - Hold'
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate marked as Hold successfully',
      data: interview
    });

  } catch (error) {
    console.error('[INTERVIEW_HOLD] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', errors: [error.message] },
      { status: 500 }
    );
  }
}
