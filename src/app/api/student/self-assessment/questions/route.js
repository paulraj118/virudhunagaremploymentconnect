import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';
import { fetchQuestions } from '@/services/questionApi';

const QUESTIONS_PER_LEVEL = 20;

const DIFFICULTY_MAP = {
  low: 'Easy',
  medium: 'Medium',
  high: 'Hard'
};

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// GET: Fetch questions for a specific level via Question Bank API
// Query: ?level=low|medium|high
// Returns 20 MCQs for the student's preferredDomain at the specified level
// Correct answers are NOT sent to the client
// ============================================================================
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: user.id }).lean();
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    if (!student.preferredDomain) {
      return NextResponse.json({ error: 'Preferred domain not set' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const requestedDomain = searchParams.get('domain');

    if (!['low', 'medium', 'high'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level. Must be low, medium, or high.' }, { status: 400 });
    }

    // *** SECURITY: Backend level lock validation ***
    const existingResults = await SelfAssessmentResult.find({
      studentId: student._id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .lean();

    const completedLevels = {};
    for (const lvl of ['low', 'medium', 'high']) {
      const latestLvlResult = existingResults.find((r) => r.level === lvl);
      completedLevels[lvl] = latestLvlResult ? latestLvlResult.percentage >= 70 : false;
    }

    if (level === 'medium' && !completedLevels.low) {
      return NextResponse.json(
        { error: 'Level locked. Score at least 70% in Fundamental to unlock.' },
        { status: 403 }
      );
    }
    if (level === 'high' && !completedLevels.medium) {
      return NextResponse.json(
        { error: 'Level locked. Score at least 70% in Intermediate to unlock.' },
        { status: 403 }
      );
    }

    const domain = requestedDomain || student.preferredDomain;

    // Fetch questions from the centralized Question Bank API
    let apiQuestions = [];
    try {
      const response = await fetchQuestions({
        category: domain,
        difficulty: DIFFICULTY_MAP[level],
        random: true,
        limit: 50 // Fetch more to allow for deduplication of seen questions
      });
      
      if (response && response.questions) {
        apiQuestions = response.questions;
      }
    } catch (apiError) {
      console.error('Question Bank API Fetch Error:', apiError);
      return NextResponse.json(
        { error: apiError.message || 'Question Bank API is currently unavailable. Please try again later.' },
        { status: apiError.status || 503 }
      );
    }

    if (!apiQuestions || apiQuestions.length === 0) {
      return NextResponse.json(
        { error: `No questions available for "${domain}" at ${level} level. Please contact the administrator.` },
        { status: 404 }
      );
    }

    // Get previously used question IDs across OTHER levels for deduplication
    const previousQuestions = existingResults
      .filter((r) => r.level !== level) // exclude current level's previous attempts
      .flatMap((r) => r.questions.map((q) => q.questionText));
    const usedQuestionTexts = new Set(previousQuestions);

    // Prioritize unseen questions
    const unseenQuestions = apiQuestions.filter(q => {
      const text = q.questionText || q.question;
      return !usedQuestionTexts.has(text);
    });
    const seenQuestions = apiQuestions.filter(q => {
      const text = q.questionText || q.question;
      return usedQuestionTexts.has(text);
    });

    // Shuffle and select
    const shuffledUnseen = shuffleArray(unseenQuestions);
    const shuffledSeen = shuffleArray(seenQuestions);
    const combined = [...shuffledUnseen, ...shuffledSeen];
    const selectedQuestions = combined.slice(0, QUESTIONS_PER_LEVEL);

    // Shuffle selected questions order
    const finalQuestions = shuffleArray(selectedQuestions);

    // Return questions WITHOUT correct answers (security)
    const clientQuestions = finalQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText || q.question, // Support backward compatibility
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      // NOTE: correctOptionIndex and explanation are NOT sent to the client
    }));

    if (clientQuestions.length === 0) {
      return NextResponse.json(
        { error: `Insufficient questions available for "${domain}" at ${level} level.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      questions: clientQuestions,
      totalQuestions: clientQuestions.length,
      level,
      domain,
      timeLimit: 20 * 60, // 20 minutes in seconds
    });
  } catch (error) {
    console.error('Self Assessment Questions GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
