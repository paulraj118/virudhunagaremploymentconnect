import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';
import TechnicalTest from '@/models/TechnicalTest';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import Student from '@/models/Student';
import { getCurrentUser } from '@/lib/auth';

// POST /api/student/technical-test/start - Start a Technical Test attempt
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized', errors: ['Authentication required with Student role'] }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, message: 'applicationId is required', errors: ['Missing applicationId'] }, { status: 400 });
    }

    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found', errors: ['No student profile linked'] }, { status: 404 });
    }

    // Security: Candidate owns this application
    const application = await JobApplication.findOne({
      _id: applicationId,
      studentId: student._id
    });

    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found', errors: ['Application does not exist or does not belong to you'] }, { status: 404 });
    }

    // Security: Test is assigned
    if (!application.technicalTestId || application.technicalTestStatus !== 'Assigned') {
      return NextResponse.json({
        success: false,
        message: 'No assigned technical test found for this application',
        errors: [`Current status: ${application.technicalTestStatus || 'Not Assigned'}`]
      }, { status: 400 });
    }

    // Security: Test is Published
    const test = await TechnicalTest.findOne({
      _id: application.technicalTestId,
      status: 'Published'
    });

    if (!test) {
      return NextResponse.json({ success: false, message: 'Technical Test is not available', errors: ['Test is not published or does not exist'] }, { status: 404 });
    }

    // Security: Candidate has not already completed the test
    const existingAttempt = await TechnicalAttempt.findOne({
      candidateId: decoded.id,
      technicalTestId: test._id,
      jobId: application.jobId
    });

    if (existingAttempt) {
      return NextResponse.json({
        success: false,
        message: 'You have already attempted this test. Only one attempt is allowed.',
        errors: [`Existing attempt: ${existingAttempt._id}, Status: ${existingAttempt.status}`]
      }, { status: 400 });
    }

    // Create a new attempt
    const attempt = await TechnicalAttempt.create({
      candidateId: decoded.id,
      companyId: test.companyId,
      hrId: test.hrId,
      jobId: application.jobId,
      technicalTestId: test._id,
      attemptNumber: 1,
      browserStartedAt: new Date(),
      status: 'In Progress',
      createdBy: decoded.id,
      updatedBy: decoded.id
    });

    // Update the application status
    application.technicalTestStatus = 'In Progress';
    await application.save();

    // Return sanitized test (WITHOUT correct answers or hidden test cases)
    const safeTest = {
      _id: test._id,
      jobRole: test.jobRole,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      duration: test.duration,
      sections: {
        sectionA_MCQ: test.sections.sectionA_MCQ.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          marks: q.marks
        })),
        sectionB_FillBlanks: test.sections.sectionB_FillBlanks.map(q => ({
          _id: q._id,
          question: q.question,
          marks: q.marks
        })),
        sectionC_Programming1: {
          _id: test.sections.sectionC_Programming1._id,
          title: test.sections.sectionC_Programming1.title,
          description: test.sections.sectionC_Programming1.description,
          supportedLanguages: test.sections.sectionC_Programming1.supportedLanguages,
          sampleInput: test.sections.sectionC_Programming1.sampleInput,
          sampleOutput: test.sections.sectionC_Programming1.sampleOutput,
          marks: test.sections.sectionC_Programming1.marks
        },
        sectionD_Programming2: {
          _id: test.sections.sectionD_Programming2._id,
          title: test.sections.sectionD_Programming2.title,
          description: test.sections.sectionD_Programming2.description,
          supportedLanguages: test.sections.sectionD_Programming2.supportedLanguages,
          sampleInput: test.sections.sectionD_Programming2.sampleInput,
          sampleOutput: test.sections.sectionD_Programming2.sampleOutput,
          marks: test.sections.sectionD_Programming2.marks
        }
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Technical Test started',
      data: {
        attemptId: attempt._id,
        test: safeTest,
        serverStartTime: attempt.browserStartedAt,
        durationMinutes: test.duration
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'You have already attempted this test. Only one attempt is allowed.',
        errors: ['Duplicate attempt detected']
      }, { status: 400 });
    }
    console.error('[TECHNICAL-TEST] Start Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', errors: [error.message] }, { status: 500 });
  }
}
