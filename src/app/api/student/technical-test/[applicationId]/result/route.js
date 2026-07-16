import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import TechnicalTest from '@/models/TechnicalTest';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await params;
    if (!applicationId) {
      return NextResponse.json({ success: false, message: 'Missing applicationId' }, { status: 400 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const application = await JobApplication.findOne({
      _id: applicationId,
      studentId: student._id
    })
      .populate('jobId', 'title role location')
      .populate('companyId', 'name logo')
      .populate('technicalTestId');

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    if (!application.technicalTestId) {
      return NextResponse.json({ success: false, message: 'No technical test associated' }, { status: 400 });
    }

    const test = application.technicalTestId;
    
    const attempt = await TechnicalAttempt.findOne({
      candidateId: decoded.id,
      technicalTestId: test._id,
      jobId: application.jobId._id
    });

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'No test attempt found' }, { status: 404 });
    }

    // Only allow viewing results if test is completed or terminated
    if (!['Completed', 'Terminated'].includes(attempt.status)) {
      return NextResponse.json({ success: false, message: 'Test is not yet completed' }, { status: 403 });
    }

    // Calculate Performance Analysis
    let mcqPercent = 0;
    let fillPercent = 0;
    let prog1Percent = 0;
    let prog2Percent = 0;

    const sections = test.sections || {};
    
    // MCQ Marks
    const mcqQuestions = sections.sectionA_MCQ || [];
    const mcqTotalMarks = mcqQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    if (mcqTotalMarks > 0) mcqPercent = Math.round((attempt.scores.mcqScore / mcqTotalMarks) * 100);

    // Fill in the blanks Marks
    const fillQuestions = sections.sectionB_FillBlanks || [];
    const fillTotalMarks = fillQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    if (fillTotalMarks > 0) fillPercent = Math.round((attempt.scores.fillBlanksScore / fillTotalMarks) * 100);

    // Programming 1 Marks
    const prog1TotalMarks = sections.sectionC_Programming1?.marks || 5;
    if (sections.sectionC_Programming1) prog1Percent = Math.round((attempt.scores.programming1Score / prog1TotalMarks) * 100);

    // Programming 2 Marks
    const prog2TotalMarks = sections.sectionD_Programming2?.marks || 5;
    if (sections.sectionD_Programming2) prog2Percent = Math.round((attempt.scores.programming2Score / prog2TotalMarks) * 100);

    const strongAreas = [];
    const weakAreas = [];
    const recommendations = [];

    // Analyze MCQ
    if (mcqTotalMarks > 0) {
      if (mcqPercent >= 70) strongAreas.push("Multiple Choice (Theoretical Knowledge)");
      else {
        weakAreas.push("Multiple Choice (Theoretical Knowledge)");
        recommendations.push("Review core theoretical concepts and fundamentals related to the job role.");
      }
    }

    // Analyze Fill Blanks
    if (fillTotalMarks > 0) {
      if (fillPercent >= 70) strongAreas.push("Fill in the Blanks (Syntax & Definitions)");
      else {
        weakAreas.push("Fill in the Blanks (Syntax & Definitions)");
        recommendations.push("Focus on exact syntax, key terms, and definitions.");
      }
    }

    // Analyze Programming
    let hasProg = false;
    let progTotalPercent = 0;
    if (sections.sectionC_Programming1 || sections.sectionD_Programming2) {
      hasProg = true;
      let obtained = (sections.sectionC_Programming1 ? attempt.scores.programming1Score : 0) + (sections.sectionD_Programming2 ? attempt.scores.programming2Score : 0);
      let total = (sections.sectionC_Programming1 ? prog1TotalMarks : 0) + (sections.sectionD_Programming2 ? prog2TotalMarks : 0);
      progTotalPercent = Math.round((obtained / total) * 100);
      
      if (progTotalPercent >= 70) strongAreas.push("Programming & Problem Solving");
      else {
        weakAreas.push("Programming & Problem Solving");
        recommendations.push("Practice coding algorithms, edge cases, and logical problem solving on platforms like LeetCode or HackerRank.");
      }
    }

    if (recommendations.length === 0 && attempt.resultStatus === 'Pass') {
      recommendations.push("Excellent performance! Keep up the good work and prepare for the upcoming HR interview.");
    }

    const analysis = {
      strongAreas,
      weakAreas,
      recommendations,
      percentages: {
        mcq: mcqPercent,
        fill: fillPercent,
        programming: hasProg ? progTotalPercent : null
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application._id,
        job: application.jobId,
        company: application.companyId,
        technicalTest: test,
        attempt: attempt,
        analysis
      }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST-RESULT] Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
