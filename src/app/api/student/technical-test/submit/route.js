import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechnicalAttempt from '@/models/TechnicalAttempt';
import TechnicalTest from '@/models/TechnicalTest';
import JobApplication from '@/models/JobApplication';
import Student from '@/models/Student';
import Notification from '@/models/Notification';
import { getCurrentUser } from '@/lib/auth';

// Judge0 Language ID Mapping (future-ready for additional languages)
const LANGUAGE_IDS = {
  'javascript': 63,  // Node.js
  'python': 71,      // Python 3
  'java': 62,        // Java (OpenJDK)
  'cpp': 54,         // C++ (GCC)
  'c': 50,           // C (GCC)
  'csharp': 51,      // C# (Mono)
  'ruby': 72,        // Ruby
  'go': 60,          // Go
  'typescript': 74,  // TypeScript
  'php': 68,         // PHP
  'swift': 83,       // Swift
  'kotlin': 78,      // Kotlin
  'rust': 73         // Rust
};

// Judge0 Status Code Reference
const JUDGE0_STATUS = {
  1: 'In Queue',
  2: 'Processing',
  3: 'Accepted',
  4: 'Wrong Answer',
  5: 'Time Limit Exceeded',
  6: 'Compilation Error',
  7: 'Runtime Error (SIGSEGV)',
  8: 'Runtime Error (SIGXFSZ)',
  9: 'Runtime Error (SIGFPE)',
  10: 'Runtime Error (SIGABRT)',
  11: 'Runtime Error (NZEC)',
  12: 'Runtime Error (Other)',
  13: 'Internal Error',
  14: 'Exec Format Error'
};

// Execute code against a single test case via Judge0
async function executeTestCase(code, languageId, input, expectedOutput) {
  const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

  if (!JUDGE0_API_KEY) {
    throw new Error('JUDGE0_API_KEY is not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': JUDGE0_API_KEY,
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
  };

  // Create submission with wait=true (synchronous)
  const createRes = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(input).toString('base64'),
      expected_output: Buffer.from(expectedOutput).toString('base64'),
      cpu_time_limit: 5,
      memory_limit: 128000,
      wall_time_limit: 10
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('[JUDGE0] Submission API error:', errText);
    return {
      passed: false,
      statusId: -1,
      statusDescription: 'Execution Service Error',
      verdict: 'SERVICE_ERROR',
      stdout: '',
      stderr: errText,
      compileOutput: '',
      time: null,
      memory: null
    };
  }

  const result = await createRes.json();
  const statusId = result.status?.id || -1;
  const passed = statusId === 3; // Accepted

  // Determine verdict label
  let verdict = 'UNKNOWN';
  if (statusId === 3) verdict = 'ACCEPTED';
  else if (statusId === 4) verdict = 'WRONG_ANSWER';
  else if (statusId === 5) verdict = 'TIME_LIMIT_EXCEEDED';
  else if (statusId === 6) verdict = 'COMPILATION_ERROR';
  else if (statusId >= 7 && statusId <= 12) verdict = 'RUNTIME_ERROR';
  else if (statusId === 13) verdict = 'INTERNAL_ERROR';

  return {
    passed,
    statusId,
    statusDescription: JUDGE0_STATUS[statusId] || result.status?.description || 'Unknown',
    verdict,
    stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString().trim() : '',
    stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString().trim() : '',
    compileOutput: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString().trim() : '',
    time: result.time,
    memory: result.memory
  };
}

// Evaluate a programming question against its 5 hidden test cases
async function evaluateProgramming(code, languageStr, hiddenTestCases, sectionLabel) {
  if (!code || code.trim() === '') {
    // Log removed
    return {
      score: 0,
      passedCount: 0,
      totalCount: hiddenTestCases.length,
      results: [],
      summary: 'No code submitted'
    };
  }

  const languageId = LANGUAGE_IDS[languageStr];
  if (!languageId) {
    // Log removed
    return {
      score: 0,
      passedCount: 0,
      totalCount: hiddenTestCases.length,
      results: [],
      summary: `Unsupported language: ${languageStr}`
    };
  }

  // Log removed

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < hiddenTestCases.length; i++) {
    const testCase = hiddenTestCases[i];
    try {
      const result = await executeTestCase(code, languageId, testCase.input, testCase.expectedOutput);
      results.push({
        testCaseIndex: i + 1,
        ...result
      });
      if (result.passed) passedCount++;

      // Log removed
    } catch (err) {
      console.error(`[JUDGE0] ${sectionLabel} TC${i + 1}: Execution error -`, err.message);
      results.push({
        testCaseIndex: i + 1,
        passed: false,
        verdict: 'EXECUTION_ERROR',
        statusDescription: err.message,
        stdout: '',
        stderr: '',
        compileOutput: ''
      });
    }
  }

  // Score = number of passed test cases (each = 1 mark, total = 5)
  const score = passedCount;
  const summary = `${passedCount}/${hiddenTestCases.length} test cases passed → ${score}/5 marks`;
  // Log removed

  return { score, passedCount, totalCount: hiddenTestCases.length, results, summary };
}

// POST /api/student/technical-test/submit - Submit the Technical Test
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { attemptId, answers, autoSubmitted, submissionReason } = body;

    if (!attemptId) {
      return NextResponse.json({ success: false, message: 'attemptId is required', errors: ['Missing attemptId'] }, { status: 400 });
    }

    // --- Security: Find the active attempt owned by this candidate ---
    const attempt = await TechnicalAttempt.findOne({
      _id: attemptId,
      candidateId: decoded.id,
      status: 'In Progress'
    });

    if (!attempt) {
      return NextResponse.json({
        success: false,
        message: 'No active test attempt found. The test may have already been submitted.',
        errors: ['Attempt not found or already completed']
      }, { status: 404 });
    }

    // --- Security: Verify test is still valid ---
    const test = await TechnicalTest.findOne({
      _id: attempt.technicalTestId,
      status: 'Published'
    });

    if (!test) {
      return NextResponse.json({
        success: false,
        message: 'Technical Test is no longer available.',
        errors: ['Test not found or unpublished']
      }, { status: 404 });
    }

    // --- Security: Check if test duration has expired (with 60s grace period) ---
    const elapsedSeconds = Math.round((new Date() - attempt.browserStartedAt) / 1000);
    const maxDurationSeconds = test.duration * 60 + 60; // duration + 60s grace
    let finalAutoSubmitted = autoSubmitted || false;
    let finalSubmissionReason = submissionReason || 'Manual Submission';
    
    if (elapsedSeconds > maxDurationSeconds) {
      // Log removed
      // Don't reject, but mark as auto-submitted
      finalAutoSubmitted = true;
      finalSubmissionReason = 'Time Expired';
    }

    // Log removed

    // --- Save final answers ---
    if (answers && attempt.answers) {
      if (answers.mcq && attempt.answers.mcq && typeof attempt.answers.mcq.set === 'function') {
        for (const [key, value] of Object.entries(answers.mcq)) {
          attempt.answers.mcq.set(key, value);
        }
      }
      if (answers.fillBlanks && attempt.answers.fillBlanks && typeof attempt.answers.fillBlanks.set === 'function') {
        for (const [key, value] of Object.entries(answers.fillBlanks)) {
          attempt.answers.fillBlanks.set(key, value);
        }
      }
      if (answers.programming1 && attempt.answers.programming1) {
        if (answers.programming1.code !== undefined) attempt.answers.programming1.code = answers.programming1.code;
        if (answers.programming1.languageId) attempt.answers.programming1.languageId = answers.programming1.languageId;
      }
      if (answers.programming2 && attempt.answers.programming2) {
        if (answers.programming2.code !== undefined) attempt.answers.programming2.code = answers.programming2.code;
        if (answers.programming2.languageId) attempt.answers.programming2.languageId = answers.programming2.languageId;
      }
    }

    // --- SECTION A: Grade MCQs (5 marks) ---
    let mcqScore = 0;
    const mcqQuestions = test.sections?.sectionA_MCQ || [];
    for (let i = 0; i < mcqQuestions.length; i++) {
      const selectedOption = attempt.answers?.mcq?.get(String(i));
      if (selectedOption !== undefined && selectedOption !== null) {
        const correctOption = mcqQuestions[i]?.correctOption || '';
        
        // Find correct index
        let correctIndex = ['A', 'B', 'C', 'D'].indexOf(String(correctOption).toUpperCase());
        if (correctIndex === -1 && correctOption) {
          correctIndex = (mcqQuestions[i]?.options || []).findIndex(
            o => o.trim().toLowerCase() === String(correctOption).trim().toLowerCase()
          );
        }
        
        // Find selected index
        let selectedIndex = ['A', 'B', 'C', 'D'].indexOf(String(selectedOption).toUpperCase());
        if (selectedIndex === -1 && selectedOption) {
          selectedIndex = (mcqQuestions[i]?.options || []).findIndex(
            o => o.trim().toLowerCase() === String(selectedOption).trim().toLowerCase()
          );
        }

        // Compare by index, or fallback to exact string match
        if ((correctIndex !== -1 && correctIndex === selectedIndex) || 
            (String(selectedOption).trim().toUpperCase() === String(correctOption).trim().toUpperCase())) {
          mcqScore += 1;
        }
      }
    }
    // Log removed

    // --- SECTION B: Grade Fill-in-the-Blanks (5 marks) ---
    let fillBlanksScore = 0;
    const fillQuestions = test.sections?.sectionB_FillBlanks || [];
    for (let i = 0; i < fillQuestions.length; i++) {
      const candidateAnswer = attempt.answers?.fillBlanks?.get(String(i));
      if (candidateAnswer) {
        const correctAnswer = fillQuestions[i]?.correctAnswer || '';
        if (String(candidateAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()) {
          fillBlanksScore += 1;
        }
      }
    }
    // Log removed

    // --- SECTION C & D: Evaluate Programming via Judge0 (5 marks each) ---
    let programming1Score = 0;
    let programming2Score = 0;
    let prog1ExecutionDetails = null;
    let prog2ExecutionDetails = null;

    try {
      const prog1Result = await evaluateProgramming(
        attempt.answers?.programming1?.code,
        attempt.answers?.programming1?.languageId,
        test.sections?.sectionC_Programming1?.hiddenTestCases || [],
        'Section C'
      );
      programming1Score = prog1Result.score;
      prog1ExecutionDetails = prog1Result;
    } catch (err) {
      console.error('[GRADING] Section C evaluation failed:', err.message);
    }

    try {
      const prog2Result = await evaluateProgramming(
        attempt.answers?.programming2?.code,
        attempt.answers?.programming2?.languageId,
        test.sections?.sectionD_Programming2?.hiddenTestCases || [],
        'Section D'
      );
      programming2Score = prog2Result.score;
      prog2ExecutionDetails = prog2Result;
    } catch (err) {
      console.error('[GRADING] Section D evaluation failed:', err.message);
    }

    // --- Calculate Total ---
    const totalScore = mcqScore + fillBlanksScore + programming1Score + programming2Score;
    const resultStatus = totalScore >= test.passingMarks ? 'Pass' : 'Fail';
    // Log removed

    // --- Update Attempt ---
    const now = new Date();
    attempt.scores = { mcqScore, fillBlanksScore, programming1Score, programming2Score, totalScore };
    attempt.resultStatus = resultStatus;
    attempt.status = 'Completed';
    attempt.submittedAt = now;
    attempt.autoSubmitted = finalAutoSubmitted;
    attempt.submissionReason = finalSubmissionReason;
    attempt.timeTaken = attempt.browserStartedAt ? Math.round((now - attempt.browserStartedAt) / 1000) : 0;
    attempt.updatedBy = decoded.id;
    await attempt.save();
    // Log removed

    // --- Update JobApplication ---
    const student = await Student.findOne({ userId: decoded.id });
    if (student) {
      await JobApplication.findOneAndUpdate(
        { studentId: student._id, jobId: attempt.jobId, technicalTestId: attempt.technicalTestId },
        { technicalTestStatus: resultStatus }
      );
    }

    // --- Update TechnicalTest completed count ---
    await TechnicalTest.findByIdAndUpdate(attempt.technicalTestId, {
      $inc: { completedCandidateCount: 1 }
    });

    // --- Generate Notifications ---
    try {
      // 1. Notify Candidate
      await Notification.create({
        recipientId: decoded.id,
        recipientRole: 'student',
        message: `Your technical test for ${test.jobRole} has been submitted and evaluated. Result: ${resultStatus}`,
        type: 'technical_test_result',
        link: `/student/technical-test/${attempt.jobId}/result`
      });

      // 2. Notify HR
      await Notification.create({
        recipientId: attempt.hrId,
        recipientRole: 'company', // Matches original HR layout/auth logic for companies
        message: `Candidate ${student?.name || 'Unknown'} has submitted the Technical Test for ${test.jobRole}. Result: ${resultStatus} (Score: ${totalScore}/20)`,
        type: 'technical_test_submission',
        link: `/company/technical-rounds/${attempt.technicalTestId}/results`
      });
    } catch (notifErr) {
      console.error('[SUBMIT] Failed to generate notifications:', notifErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Technical Test submitted and graded successfully',
      data: {
        mcqScore,
        fillBlanksScore,
        programming1Score,
        programming2Score,
        totalScore,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        resultStatus,
        timeTaken: attempt.timeTaken,
        autoSubmitted: attempt.autoSubmitted,
        executionDetails: {
          programming1: prog1ExecutionDetails ? {
            passedCount: prog1ExecutionDetails.passedCount,
            totalCount: prog1ExecutionDetails.totalCount,
            summary: prog1ExecutionDetails.summary,
            results: prog1ExecutionDetails.results.map(r => ({
              testCaseIndex: r.testCaseIndex,
              verdict: r.verdict,
              statusDescription: r.statusDescription,
              time: r.time,
              memory: r.memory
            }))
          } : null,
          programming2: prog2ExecutionDetails ? {
            passedCount: prog2ExecutionDetails.passedCount,
            totalCount: prog2ExecutionDetails.totalCount,
            summary: prog2ExecutionDetails.summary,
            results: prog2ExecutionDetails.results.map(r => ({
              testCaseIndex: r.testCaseIndex,
              verdict: r.verdict,
              statusDescription: r.statusDescription,
              time: r.time,
              memory: r.memory
            }))
          } : null
        }
      }
    });

  } catch (error) {
    console.error('[SUBMIT] Server Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during submission', errors: [error.message] }, { status: 500 });
  }
}
