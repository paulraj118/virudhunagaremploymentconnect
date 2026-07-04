import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import SelfAssessmentResult from '@/models/SelfAssessmentResult';
import SelfAssessmentQuestion from '@/models/SelfAssessmentQuestion';
import { getCurrentUser } from '@/lib/auth';

// ============================================================================
// GET: Fetch student enrollment data, completed levels, analytics, and history
// ============================================================================
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch student enrollment data
    const student = await Student.findOne({ userId: user.id }).populate('userId', 'name email').lean();
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found. Please complete enrollment first.' }, { status: 404 });
    }

    if (!student.preferredDomain) {
      return NextResponse.json({ error: 'Preferred domain not set. Please complete enrollment first.' }, { status: 400 });
    }

    // Fetch all self-assessment results for this student
    const allResults = await SelfAssessmentResult.find({
      studentId: student._id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Determine completed/unlocked status based on LATEST completed attempt for each level
    const completedLevels = {};
    const latestScores = {};
    const levelOrder = ['low', 'medium', 'high'];
    for (const level of levelOrder) {
      const latestResult = allResults.find((r) => r.level === level);
      if (latestResult) {
        latestScores[level] = latestResult.percentage;
        completedLevels[level] = latestResult.percentage >= 70;
      } else {
        latestScores[level] = null;
        completedLevels[level] = false;
      }
    }

    // Level unlock logic:
    // LOW → always unlocked
    // MEDIUM → unlocked only if LOW is completed (passed)
    // HIGH → unlocked only if MEDIUM is completed (passed)
    const unlockedLevels = {
      low: true,
      medium: completedLevels.low === true,
      high: completedLevels.medium === true,
    };

    // Analytics
    const totalAssessments = allResults.length;
    const scores = allResults.map((r) => r.percentage);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const latestAttempt = allResults.length > 0 ? allResults[0] : null;

    // Completed/pending level counts
    const completedLevelCount = Object.values(completedLevels).filter(Boolean).length;
    const pendingLevelCount = 3 - completedLevelCount;

    // Performance trend (last 10 assessments, oldest first)
    const performanceTrend = allResults
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        date: r.completionDate || r.createdAt,
        percentage: r.percentage,
        level: r.level,
        passFail: r.passFail,
      }));

    // Level-wise best scores
    const levelWiseProgress = {};
    for (const level of levelOrder) {
      const levelResults = allResults.filter((r) => r.level === level);
      if (levelResults.length > 0) {
        const bestResult = levelResults.reduce((best, r) =>
          r.percentage > best.percentage ? r : best
        );
        levelWiseProgress[level] = {
          bestPercentage: bestResult.percentage,
          attempts: levelResults.length,
          passed: completedLevels[level],
          lastAttempt: levelResults[0].completionDate || levelResults[0].createdAt,
        };
      }
    }

    // Assessment history
    const history = allResults.map((r) => ({
      _id: r._id,
      level: r.level,
      score: r.score,
      percentage: r.percentage,
      totalQuestions: r.totalQuestions,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
      skippedCount: r.skippedCount,
      passFail: r.passFail,
      timeTaken: r.timeTaken,
      completionDate: r.completionDate || r.createdAt,
      attemptNumber: r.attemptNumber,
    }));

    // Fetch available domains (domains with at least one question)
    const availableDomainsAggr = await SelfAssessmentQuestion.aggregate([
      { $group: { _id: "$domain", count: { $sum: 1 } } },
      { $match: { count: { $gt: 0 } } }
    ]);
    const availableDomains = availableDomainsAggr.map(d => d._id);

    return NextResponse.json({
      student: {
        name: student.userId?.name || '',
        email: student.userId?.email || '',
        collegeName: student.collegeName || '',
        degree: student.degree || '',
        department: student.department || '',
        preferredDomain: student.preferredDomain || '',
        industryTrack: student.industryTrack || '',
        preferredJobRole: student.preferredJobRole || '',
        programmingLanguages: student.programmingLanguages || [],
        areasOfInterest: student.areasOfInterest || [],
        hasInternship: student.hasInternship || '',
        internshipCompany: student.internshipCompany || '',
        internshipDuration: student.internshipDuration || '',
        numberOfProjects: student.numberOfProjects || 0,
        projectTitles: student.projectTitles || [],
        selfAssessmentProfileCompleted: !!student.selfAssessmentProfileCompleted
      },
      completedLevels,
      unlockedLevels,
      latestScores,
      analytics: {
        totalAssessments,
        highestScore,
        averageScore,
        completedLevelCount,
        pendingLevelCount,
        latestAttempt: latestAttempt
          ? {
              level: latestAttempt.level,
              percentage: latestAttempt.percentage,
              passFail: latestAttempt.passFail,
              date: latestAttempt.completionDate || latestAttempt.createdAt,
            }
          : null,
        performanceTrend,
        levelWiseProgress,
      },
      history,
      availableDomains,
    });
  } catch (error) {
    console.error('Self Assessment GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST: Submit assessment answers, evaluate, generate feedback, and save
// ============================================================================
export async function POST(request) {
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

    const body = await request.json();
    const { level, answers, startTime, questionIds } = body;

    // Validate level
    if (!['low', 'medium', 'high'].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
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

    // Enforce unlock rules
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

    // Validate answers
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

    // Retrieve the original questions with correct answers
    const Question = (await import('@/models/Question')).default;
    
    let questions = [];
    if (questionIds && questionIds.length > 0) {
      // Fetch questions by IDs from the unified Question collection
      const mongoose = (await import('mongoose')).default;
      questions = await Question.find({
        _id: { $in: questionIds.map(id => new mongoose.Types.ObjectId(id)) },
      }).lean();
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found. Please start a new assessment.' }, { status: 400 });
    }

    // Map answers to questions and evaluate
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const evaluatedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[i];
      const selectedOptionIndex = answer?.selectedOptionIndex ?? -1;
      let isCorrect = false;
      if (question.correctOptionIndex !== undefined && question.correctOptionIndex !== null) {
        isCorrect = selectedOptionIndex === question.correctOptionIndex;
      } else if (question.correctAnswer) {
        const selectedText = question.options[selectedOptionIndex];
        isCorrect = selectedText === question.correctAnswer;
      }
      
      const isSkipped = selectedOptionIndex === -1;

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      let finalCorrectIndex = question.correctOptionIndex;
      if ((finalCorrectIndex === undefined || finalCorrectIndex === null) && question.correctAnswer) {
        finalCorrectIndex = question.options.indexOf(question.correctAnswer);
      }

      evaluatedQuestions.push({
        questionId: question._id.toString(),
        questionText: question.questionText || question.question,
        options: question.options,
        selectedOptionIndex,
        correctOptionIndex: finalCorrectIndex,
        isCorrect: !isSkipped && isCorrect,
        explanation: question.explanation,
        topic: question.topic,
        difficulty: question.difficulty,
      });
    }

    const totalQuestions = questions.length;
    const score = correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passFail = percentage >= 70 ? 'Pass' : 'Fail';

    // Calculate time taken
    const endTime = new Date();
    const start = startTime ? new Date(startTime) : new Date(endTime.getTime() - 1200000);
    const timeTaken = Math.round((endTime - start) / 1000);

    // ===== FEEDBACK ENGINE =====
    const feedback = generateFeedback(evaluatedQuestions, percentage, level, timeTaken, totalQuestions, student.preferredDomain);

    // Calculate attempt number
    const previousAttempts = existingResults.filter(
      (r) => r.level === level
    ).length;

    // Save to database
    const result = await SelfAssessmentResult.create({
      studentId: student._id,
      industryTrack: student.industryTrack || '',
      preferredDomain: student.preferredDomain,
      level,
      attemptNumber: previousAttempts + 1,
      totalQuestions,
      questions: evaluatedQuestions,
      score,
      percentage,
      correctCount,
      wrongCount,
      skippedCount,
      passFail,
      timeTaken,
      startTime: start,
      endTime,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      topicPerformance: feedback.topicPerformance,
      suggestions: feedback.suggestions,
      interviewReadiness: feedback.interviewReadiness,
      confidenceLevel: feedback.confidenceLevel,
      suggestedStudyTime: feedback.suggestedStudyTime,
      overallRecommendation: feedback.overallRecommendation,
      status: 'completed',
      completionDate: endTime,
    });

    return NextResponse.json({
      success: true,
      resultId: result._id,
      score,
      percentage,
      passFail,
      correctCount,
      wrongCount,
      skippedCount,
      totalQuestions,
      timeTaken,
      level,
    });
  } catch (error) {
    console.error('Self Assessment POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// FEEDBACK ENGINE — Generates personalized, non-generic feedback
// ============================================================================
function generateFeedback(evaluatedQuestions, percentage, level, timeTaken, totalQuestions, domain) {
  // 1. Calculate topic-wise performance
  const topicStats = {};
  for (const q of evaluatedQuestions) {
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, total: 0, wrong: 0, skipped: 0 };
    }
    topicStats[q.topic].total++;
    if (q.isCorrect) topicStats[q.topic].correct++;
    else if (q.selectedOptionIndex === -1) topicStats[q.topic].skipped++;
    else topicStats[q.topic].wrong++;
  }

  const topicPerformance = {};
  for (const [topic, stats] of Object.entries(topicStats)) {
    topicPerformance[topic] = Math.round((stats.correct / stats.total) * 100);
  }

  // 2. Identify strengths (>= 80% accuracy)
  const strengths = [];
  for (const [topic, pct] of Object.entries(topicPerformance)) {
    if (pct >= 80) {
      strengths.push(`Strong understanding of ${topic} (${pct}% accuracy)`);
    }
  }
  if (strengths.length === 0 && percentage >= 50) {
    strengths.push('Demonstrates basic understanding across multiple topics');
  }
  if (percentage >= 90) {
    strengths.push('Exceptional overall performance indicating deep domain knowledge');
  }
  if (percentage >= 70 && timeTaken < 600) {
    strengths.push('Excellent time management — completed efficiently with high accuracy');
  }

  // 3. Identify weaknesses (< 50% accuracy)
  const weaknesses = [];
  for (const [topic, pct] of Object.entries(topicPerformance)) {
    if (pct < 50) {
      weaknesses.push(`Needs improvement in ${topic} (${pct}% accuracy)`);
    }
  }
  const skippedTotal = evaluatedQuestions.filter(q => q.selectedOptionIndex === -1).length;
  if (skippedTotal > 3) {
    weaknesses.push(`Skipped ${skippedTotal} questions — indicates gaps in confidence or knowledge`);
  }
  if (percentage < 40) {
    weaknesses.push('Fundamental concepts need significant review');
  }

  // 4. Interview readiness score
  let interviewReadiness = percentage;
  // Bonus for all topics > 60%
  const allTopicsAbove60 = Object.values(topicPerformance).every(p => p >= 60);
  if (allTopicsAbove60 && Object.keys(topicPerformance).length > 2) {
    interviewReadiness = Math.min(100, interviewReadiness + 10);
  }
  // Penalty for any topic at 0%
  const anyTopicZero = Object.values(topicPerformance).some(p => p === 0);
  if (anyTopicZero) {
    interviewReadiness = Math.max(0, interviewReadiness - 15);
  }
  // Level modifier
  if (level === 'high' && percentage >= 70) interviewReadiness = Math.min(100, interviewReadiness + 10);
  if (level === 'low' && percentage < 70) interviewReadiness = Math.max(0, interviewReadiness - 10);
  interviewReadiness = Math.round(Math.min(100, Math.max(0, interviewReadiness)));

  // 5. Confidence level
  let confidenceLevel = 'Low';
  if (percentage >= 90) confidenceLevel = 'Very High';
  else if (percentage >= 75) confidenceLevel = 'High';
  else if (percentage >= 50) confidenceLevel = 'Medium';

  // 6. Suggested study time
  const weakTopicCount = Object.values(topicPerformance).filter(p => p < 60).length;
  let suggestedStudyTime = '';
  if (weakTopicCount === 0) {
    suggestedStudyTime = 'Minimal revision needed — 2-3 hours for edge case review';
  } else if (weakTopicCount <= 2) {
    suggestedStudyTime = `Focus 8-10 hours on weak areas over the next week`;
  } else if (weakTopicCount <= 4) {
    suggestedStudyTime = `Dedicate 15-20 hours over the next 2 weeks for comprehensive study`;
  } else {
    suggestedStudyTime = `Intensive study recommended — 25-30 hours over 3 weeks with structured practice`;
  }

  // 7. Suggestions — targeted, specific recommendations
  const suggestions = [];
  
  // Topic-specific suggestions
  for (const [topic, pct] of Object.entries(topicPerformance)) {
    if (pct < 50) {
      suggestions.push(`Study ${topic} fundamentals in ${domain} — focus on core concepts and practice problems`);
    } else if (pct >= 50 && pct < 80) {
      suggestions.push(`Review advanced ${topic} concepts to strengthen your understanding`);
    }
  }

  // General suggestions based on score
  if (percentage < 50) {
    suggestions.push(`Focus on building a strong foundation in ${domain} basics before attempting higher levels`);
    suggestions.push('Use structured learning resources like video tutorials and official documentation');
  } else if (percentage < 70) {
    suggestions.push('Practice with hands-on projects to apply theoretical knowledge');
    suggestions.push(`Consider taking mock interviews focused on ${domain}`);
  } else {
    suggestions.push(`Excellent foundation in ${domain} — explore advanced topics and real-world applications`);
    if (level !== 'high') {
      suggestions.push('You are ready to attempt the next difficulty level');
    }
  }

  // Skipping behavior
  if (skippedTotal > 5) {
    suggestions.push('Practice time management — try to attempt all questions even if unsure');
  }

  // Level-specific next steps
  const nextLevelMap = { low: 'Medium', medium: 'High', high: null };
  const nextLevel = nextLevelMap[level];

  // 8. Overall recommendation
  let overallRecommendation = '';
  if (percentage >= 90) {
    overallRecommendation = `Outstanding performance at ${level.charAt(0).toUpperCase() + level.slice(1)} level! Your ${domain} knowledge is excellent.${nextLevel ? ` You are strongly recommended to take the ${nextLevel} level assessment.` : ' You have demonstrated mastery at the highest level. You are well-prepared for technical interviews.'}`;
  } else if (percentage >= 70) {
    overallRecommendation = `Good performance! You passed the ${level.charAt(0).toUpperCase() + level.slice(1)} level assessment.${nextLevel ? ` The ${nextLevel} level is now unlocked. Review your weak areas before proceeding.` : ' Congratulations on completing all levels!'}`;
  } else if (percentage >= 50) {
    overallRecommendation = `Decent attempt but below the passing threshold (70%). Review the topics where you scored below 60% and reattempt the ${level.charAt(0).toUpperCase() + level.slice(1)} level assessment.`;
  } else {
    overallRecommendation = `This score indicates significant gaps in ${domain} knowledge at the ${level.charAt(0).toUpperCase() + level.slice(1)} level. Dedicate focused study time to the fundamentals before reattempting.`;
  }

  return {
    strengths,
    weaknesses,
    topicPerformance,
    suggestions,
    interviewReadiness,
    confidenceLevel,
    suggestedStudyTime,
    overallRecommendation,
  };
}
