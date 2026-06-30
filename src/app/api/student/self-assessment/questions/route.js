import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import { getCurrentUser } from '@/lib/auth';
import selfAssessmentQuestionBank from '@/lib/selfAssessmentQuestionBank';

const QUESTIONS_PER_LEVEL = 20;

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
// GET: Fetch questions for a specific level
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

    // Try to find questions from MongoDB first
    let questions = await SelfAssessmentQuestion.find({
      domain: domain,
      level: level,
    }).lean();

    // If not enough questions in DB, seed from question bank
    if (questions.length < QUESTIONS_PER_LEVEL) {
      await seedQuestionsForDomain(domain, level);
      questions = await SelfAssessmentQuestion.find({
        domain: domain,
        level: level,
      }).lean();
    }

    // If still no questions, try case-insensitive match
    if (questions.length === 0) {
      questions = await SelfAssessmentQuestion.find({
        domain: { $regex: new RegExp(`^${escapeRegex(domain)}$`, 'i') },
        level: level,
      }).lean();
    }

    // If still no questions, try partial match
    if (questions.length === 0) {
      // Try matching with domain words
      const domainWords = domain.split(/[\s&,/]+/).filter(w => w.length > 2);
      for (const word of domainWords) {
        questions = await SelfAssessmentQuestion.find({
          domain: { $regex: new RegExp(escapeRegex(word), 'i') },
          level: level,
        }).lean();
        if (questions.length > 0) break;
      }
    }

    if (questions.length === 0) {
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
    const unseenQuestions = questions.filter(q => !usedQuestionTexts.has(q.questionText));
    const seenQuestions = questions.filter(q => usedQuestionTexts.has(q.questionText));

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
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      // NOTE: correctOptionIndex and explanation are NOT sent to the client
    }));

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

// ============================================================================
// Seed questions from the question bank into MongoDB
// ============================================================================
async function seedQuestionsForDomain(domain, level) {
  try {
    // 1. Find matching questions from the static question bank
    const bankQuestions = selfAssessmentQuestionBank.filter(
      (q) => q.domain.toLowerCase() === domain.toLowerCase() && q.level === level
    );

    if (bankQuestions.length > 0) {
      await bulkInsertQuestions(bankQuestions);
      return;
    }

    // 2. Try partial match from static bank
    const domainLower = domain.toLowerCase();
    const partialMatch = selfAssessmentQuestionBank.filter(
      (q) =>
        q.level === level &&
        (q.domain.toLowerCase().includes(domainLower) ||
          domainLower.includes(q.domain.toLowerCase()))
    );
    if (partialMatch.length > 0) {
      const questionsToInsert = partialMatch.map((q) => ({
        ...q,
        domain: domain,
      }));
      await bulkInsertQuestions(questionsToInsert);
      return;
    }
  } catch (error) {
    console.error('Seed questions error:', error);
  }
}

async function bulkInsertQuestions(questions) {
  const operations = questions.map((q) => ({
    updateOne: {
      filter: { domain: q.domain, level: q.level, questionText: q.questionText },
      update: { $setOnInsert: q },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await SelfAssessmentQuestion.bulkWrite(operations, { ordered: false });
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
