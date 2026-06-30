import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import { getCurrentUser } from '@/lib/auth';

// POST /api/student/technical-test/save - Auto-save candidate answers periodically
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with Student role'] }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { attemptId, answers } = body;

    if (!attemptId) {
      return NextResponse.json({ success: false, message: 'attemptId is required', errors: ['Missing attemptId'] }, { status: 400 });
    }

    // Security: Find the active attempt owned by this candidate
    const attempt = await TechnicalAttempt.findOne({
      _id: attemptId,
      candidateId: decoded.id,
      status: 'In Progress'
    });

    if (!attempt) {
      return NextResponse.json({
        success: false,
        message: 'No active test attempt found. The test may have already been submitted or terminated.',
        errors: ['Attempt not found, not owned by you, or not In Progress']
      }, { status: 404 });
    }

    // Update only the answers that are provided
    if (answers) {
      if (answers.mcq) {
        for (const [key, value] of Object.entries(answers.mcq)) {
          attempt.answers.mcq.set(key, value);
        }
      }
      if (answers.fillBlanks) {
        for (const [key, value] of Object.entries(answers.fillBlanks)) {
          attempt.answers.fillBlanks.set(key, value);
        }
      }
      if (answers.programming1) {
        if (answers.programming1.code !== undefined) attempt.answers.programming1.code = answers.programming1.code;
        if (answers.programming1.languageId) attempt.answers.programming1.languageId = answers.programming1.languageId;
      }
      if (answers.programming2) {
        if (answers.programming2.code !== undefined) attempt.answers.programming2.code = answers.programming2.code;
        if (answers.programming2.languageId) attempt.answers.programming2.languageId = answers.programming2.languageId;
      }
    }

    attempt.updatedBy = decoded.id;
    await attempt.save();

    return NextResponse.json({
      success: true,
      message: 'Answers saved successfully',
      data: { savedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Auto-Save Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
