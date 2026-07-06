import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import TechnicalTest from '@/models/TechnicalTest';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import Job from '@/models/Job';
import Company from '@/models/Company';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

// GET /api/student/technical-test/pending - Fetch all assigned technical tests for the candidate
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with Student role'] }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found', errors: ['No student profile linked'] }, { status: 404 });
    }

    // Security: Only fetch this candidate's own applications
    const applications = await JobApplication.find({
      studentId: student._id,
      technicalTestId: { $exists: true, $ne: null },
      technicalTestStatus: { $in: ['Assigned', 'In Progress', 'Completed', 'Pass', 'Fail'] }
    })
      .populate('jobId', 'title role location')
      .populate('companyId', 'name logo')
      .populate('technicalTestId', 'jobRole totalMarks passingMarks duration status sections');

    const testsWithAttemptStatus = await Promise.all(
      applications.map(async (app) => {
        const attempt = await TechnicalAttempt.findOne({
          candidateId: decoded.id,
          technicalTestId: app.technicalTestId?._id,
          jobId: app.jobId?._id
        }).select('status resultStatus scores.totalScore browserStartedAt submittedAt timeTaken answers');

        let sanitizedTest = null;
        if (app.technicalTestId) {
          const test = app.technicalTestId;
          sanitizedTest = {
            _id: test._id,
            jobRole: test.jobRole,
            totalMarks: test.totalMarks,
            passingMarks: test.passingMarks,
            duration: test.duration,
            status: test.status,
            sections: test.sections ? {
              sectionA_MCQ: (test.sections.sectionA_MCQ || []).map(q => ({
                _id: q._id, question: q.question, options: q.options, marks: q.marks
              })),
              sectionB_FillBlanks: (test.sections.sectionB_FillBlanks || []).map(q => ({
                _id: q._id, question: q.question, marks: q.marks
              })),
              sectionC_Programming1: test.sections.sectionC_Programming1 ? {
                _id: test.sections.sectionC_Programming1._id,
                title: test.sections.sectionC_Programming1.title,
                description: test.sections.sectionC_Programming1.description,
                supportedLanguages: test.sections.sectionC_Programming1.supportedLanguages,
                sampleInput: test.sections.sectionC_Programming1.sampleInput,
                sampleOutput: test.sections.sectionC_Programming1.sampleOutput,
                marks: test.sections.sectionC_Programming1.marks
              } : null,
              sectionD_Programming2: test.sections.sectionD_Programming2 ? {
                _id: test.sections.sectionD_Programming2._id,
                title: test.sections.sectionD_Programming2.title,
                description: test.sections.sectionD_Programming2.description,
                supportedLanguages: test.sections.sectionD_Programming2.supportedLanguages,
                sampleInput: test.sections.sectionD_Programming2.sampleInput,
                sampleOutput: test.sections.sectionD_Programming2.sampleOutput,
                marks: test.sections.sectionD_Programming2.marks
              } : null
            } : null
          };
        }

        return {
          applicationId: app._id,
          jobId: app.jobId,
          company: app.companyId,
          technicalTest: sanitizedTest,
          technicalTestStatus: app.technicalTestStatus,
          attempt: attempt || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Found ${testsWithAttemptStatus.length} technical test(s)`,
      data: { tests: testsWithAttemptStatus, count: testsWithAttemptStatus.length }
    });

  } catch (error) {
    console.error('[TECHNICAL-TEST] Fetch Pending Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
