import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { attemptId, eventType, browserVisibilityState, fullscreenStatus } = body;

    if (!attemptId || !eventType) {
      return NextResponse.json({ success: false, message: 'attemptId and eventType are required' }, { status: 400 });
    }

    const attempt = await TechnicalAttempt.findOne({
      _id: attemptId,
      candidateId: decoded.id,
      status: 'In Progress'
    });

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'Active attempt not found' }, { status: 404 });
    }

    // Increment warning count and push log
    attempt.warningCount += 1;
    attempt.cheatingLogs.push({
      eventType,
      browserVisibilityState,
      fullscreenStatus
    });

    let autoSubmitTriggered = false;
    
    // Auto-terminate if warnings exceed 3
    if (attempt.warningCount >= 4) {
      attempt.status = 'Terminated';
      attempt.autoSubmitted = true;
      attempt.submissionReason = 'Warning Limit Exceeded';
      attempt.resultStatus = 'Fail';
      attempt.submittedAt = new Date();
      autoSubmitTriggered = true;
    }

    await attempt.save();

    return NextResponse.json({
      success: true,
      data: {
        warningCount: attempt.warningCount,
        autoSubmitTriggered
      }
    });

  } catch (error) {
    console.error('[WARNING_API] Error processing warning:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
