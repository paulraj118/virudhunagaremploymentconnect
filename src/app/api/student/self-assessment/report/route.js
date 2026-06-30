import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';

// ============================================================================
// GET: Fetch a specific assessment report
// Query: ?id=<assessmentId>
// ============================================================================
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: user.id }).populate('userId', 'name email').lean();
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // *** SECURITY: Only fetch reports belonging to this student ***
    const report = await SelfAssessmentResult.findOne({
      _id: reportId,
      studentId: student._id, // Ensures student can only access their own reports
    }).lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 });
    }

    // Convert Map to plain object for topicPerformance
    let topicPerformance = {};
    if (report.topicPerformance) {
      if (report.topicPerformance instanceof Map) {
        topicPerformance = Object.fromEntries(report.topicPerformance);
      } else {
        topicPerformance = report.topicPerformance;
      }
    }

    return NextResponse.json({
      report: {
        _id: report._id,
        // Candidate details
        candidateInfo: {
          name: student.userId?.name || 'Candidate',
          email: student.userId?.email || 'N/A',
          candidateId: student.candidateId,
          phone: student.phone || '',
        },
        // Assessment context
        industryTrack: report.industryTrack,
        preferredDomain: report.preferredDomain,
        level: report.level,
        attemptNumber: report.attemptNumber,
        // Scoring
        score: report.score,
        percentage: report.percentage,
        totalQuestions: report.totalQuestions,
        correctCount: report.correctCount,
        wrongCount: report.wrongCount,
        skippedCount: report.skippedCount,
        passFail: report.passFail,
        // Timing
        timeTaken: report.timeTaken,
        startTime: report.startTime,
        endTime: report.endTime,
        completionDate: report.completionDate,
        // Questions with full review
        questions: report.questions,
        // Feedback
        strengths: report.strengths || [],
        weaknesses: report.weaknesses || [],
        topicPerformance,
        suggestions: report.suggestions || [],
        interviewReadiness: report.interviewReadiness || 0,
        confidenceLevel: report.confidenceLevel || 'Low',
        suggestedStudyTime: report.suggestedStudyTime || '',
        overallRecommendation: report.overallRecommendation || '',
      },
    });
  } catch (error) {
    console.error('Self Assessment Report GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
