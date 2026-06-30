import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Question from '@/models/Question';
import AssessmentResult from '@/models/AssessmentResult';
import JobApplication from '@/models/JobApplication';
import Job from '@/models/Job';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { fallbackQuestions, resolveDomain, getFallbackDomain } from '@/lib/assessmentDefaults';

const TOTAL_QUESTIONS = 20;
const DIFFICULTY_DISTRIBUTION = { Easy: 8, Medium: 8, Hard: 4 }; // 40/40/20

// Helper to map student preferred domain to question domains
function mapDomain(student) {
  if (student.preferredDomain) return student.preferredDomain;
  if (student.skills && student.skills.length > 0) return student.skills[0];
  return 'General';
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Select questions avoiding previously used ones, with difficulty distribution
function selectQuestions(pool, previouslyUsedTexts, totalNeeded, difficultyDist) {
  const selected = [];
  const usedTexts = new Set(previouslyUsedTexts);

  for (const [difficulty, count] of Object.entries(difficultyDist)) {
    const diffPool = pool.filter(q => q.difficulty === difficulty);
    
    // Prioritize unseen questions
    const unseen = diffPool.filter(q => !usedTexts.has(q.questionText));
    const seen = diffPool.filter(q => usedTexts.has(q.questionText));
    
    // Shuffle both pools
    const shuffledUnseen = shuffleArray(unseen);
    const shuffledSeen = shuffleArray(seen);
    
    // Pick unseen first, then seen as fallback
    const combined = [...shuffledUnseen, ...shuffledSeen];
    const picked = combined.slice(0, count);
    selected.push(...picked);
  }

  // If we didn't get enough from difficulty distribution, fill from remaining pool
  if (selected.length < totalNeeded) {
    const selectedTexts = new Set(selected.map(q => q.questionText));
    const remaining = pool.filter(q => !selectedTexts.has(q.questionText));
    const shuffledRemaining = shuffleArray(remaining);
    const needed = totalNeeded - selected.length;
    selected.push(...shuffledRemaining.slice(0, needed));
  }

  return shuffleArray(selected).slice(0, totalNeeded);
}

// GET: Returns proctored assessment questions
export async function GET(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: decoded.id }).populate('userId', 'name');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    if (student.enrollmentStatus !== 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Your profile is pending approval. You can start the assessment once approved.'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isPing = searchParams.get('ping') === 'true';
    const isStart = searchParams.get('start') === 'true';
    const sessionId = searchParams.get('sessionId');
    const jobId = searchParams.get('jobId');
    let jobTitle = '';
    let jobDescription = '';
    let jobSkills = [];
    
    if (jobId) {
      try {
        const dbJob = await Job.findById(jobId);
        if (dbJob) {
          jobTitle = dbJob.title;
          jobDescription = dbJob.description;
          jobSkills = dbJob.skills || [];
        }
      } catch (e) {
        console.error("Error fetching job details for assessment:", e);
      }
    }
    
    const isJobBased = jobSkills.length > 0 && jobDescription;

    if (isPing) {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: 'Session ID required' }, { status: 400 });
      }
      const isValid = student.activeSessionId === sessionId;
      return NextResponse.json({ success: true, active: isValid });
    }

    if (isStart) {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: 'Session ID required' }, { status: 400 });
      }
      student.activeSessionId = sessionId;
      await student.save();
      return NextResponse.json({ success: true, message: 'Assessment session initialized' });
    }

    // Check if they already have an assessment result for this specific job
    let existingResultQuery = { studentId: student._id };
    if (jobId && jobId !== 'null') {
      existingResultQuery.jobId = jobId;
    }

    const existingResult = await AssessmentResult.findOne(existingResultQuery).sort({ createdAt: -1 });
    
    // Determine if we should block retake
    let shouldBlock = false;
    let alreadyTakenJob = false;
    
    if (existingResult) {
      if (jobId && jobId !== 'null') {
        // Job-Based Assessment: One attempt only, regardless of pass/fail
        shouldBlock = true;
        alreadyTakenJob = true;
      } else {
        // Self-Assessment: Allow retake if they failed, block if passed
        if (existingResult.passFail === 'Pass') {
          shouldBlock = true;
        }
      }
    }

    if (shouldBlock) {
      return NextResponse.json({
        success: true,
        completed: true,
        alreadyTakenJob: alreadyTakenJob,
        result: existingResult,
        studentName: student.userId?.name || student.name || 'Student'
      });
    }

    // =====================================================
    // DOMAIN-SPECIFIC QUESTION GENERATION
    // =====================================================
    const rawDomain = mapDomain(student);
    const resolvedDomain = resolveDomain(rawDomain);
    const fallbackDomainName = getFallbackDomain(rawDomain);

    // Get previously used question texts to avoid repetition
    const previousResults = await AssessmentResult.find({ studentId: student._id })
      .select('domain')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Also check DB for questions the student previously answered
    // We'll look at question texts from previous assessment sessions
    let previouslyUsedTexts = [];
    try {
      const previousQuestionDocs = await Question.find({ 
        domain: new RegExp(resolvedDomain || rawDomain, 'i') 
      }).select('questionText').limit(500);
      // We use a heuristic: if the student has taken assessments before, 
      // mark those domain questions as "seen" proportionally
      if (previousResults.length > 0) {
        const seenCount = previousResults.length * TOTAL_QUESTIONS;
        previouslyUsedTexts = previousQuestionDocs
          .slice(0, seenCount)
          .map(q => q.questionText);
      }
    } catch (e) {
      console.error('Error fetching previous questions:', e);
    }

    let finalQuestions = [];

    // Step 1: Try AI Question Generation using Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const domainLabel = resolvedDomain || rawDomain;
        let prompt;

        if (isJobBased) {
          // =====================================================
          // JOB-BASED QUESTION GENERATION (Apply Now flow)
          // =====================================================
          const skillsList = jobSkills.join(', ');
          prompt = `Generate exactly ${TOTAL_QUESTIONS} multiple choice questions for a job assessment.

JOB TITLE: "${jobTitle}"
REQUIRED SKILLS: ${skillsList}
JOB DESCRIPTION: ${jobDescription}

DIFFICULTY DISTRIBUTION (STRICT):
- ${DIFFICULTY_DISTRIBUTION.Easy} questions with difficulty "Easy" (fundamentals, basic definitions, terminology of the required skills)
- ${DIFFICULTY_DISTRIBUTION.Medium} questions with difficulty "Medium" (practical scenarios, application of the required skills)
- ${DIFFICULTY_DISTRIBUTION.Hard} questions with difficulty "Hard" (problem solving, advanced concepts, job-specific scenarios)

RULES:
- Questions must be generated ONLY from the Required Skills and Job Description above.
- Cover core technical concepts of each required skill.
- Include practical problem-solving questions.
- Include job-specific scenario questions based on the job description.
- Questions must be suitable for freshers and job seekers.
- NO generic aptitude or unrelated questions.
- NO duplicate questions.
- Each question must have exactly 4 options with only one correct answer.
${previouslyUsedTexts.length > 0 ? `- Do NOT use any of these question texts (already asked before): ${previouslyUsedTexts.slice(0, 10).map(t => `"${t.substring(0, 60)}"`).join(', ')}` : ''}

Return ONLY a raw JSON array of objects. Each object must have exactly these fields:
- "questionText" (string)
- "options" (array of exactly 4 strings)
- "correctOptionIndex" (integer 0 to 3)
- "difficulty" (string: "Easy", "Medium", or "Hard")`;
        } else {
          // =====================================================
          // DOMAIN-BASED QUESTION GENERATION (existing flow)
          // =====================================================
          prompt = `Generate exactly ${TOTAL_QUESTIONS} multiple choice questions for the domain: "${domainLabel}".

DIFFICULTY DISTRIBUTION (STRICT):
- ${DIFFICULTY_DISTRIBUTION.Easy} questions with difficulty "Easy" (fundamentals, basic definitions, terminology)
- ${DIFFICULTY_DISTRIBUTION.Medium} questions with difficulty "Medium" (concepts, practical scenarios, application)
- ${DIFFICULTY_DISTRIBUTION.Hard} questions with difficulty "Hard" (problem solving, advanced concepts, industry knowledge)

RULES:
- Questions must be relevant ONLY to "${domainLabel}" domain.
- Questions must be suitable for freshers and job seekers.
- Questions must test real industry-relevant skills.
- NO generic aptitude or unrelated questions.
- NO duplicate questions.
- Each question must have exactly 4 options with only one correct answer.
${previouslyUsedTexts.length > 0 ? `- Do NOT use any of these question texts (already asked before): ${previouslyUsedTexts.slice(0, 10).map(t => `"${t.substring(0, 60)}"`).join(', ')}` : ''}

Return ONLY a raw JSON array of objects. Each object must have exactly these fields:
- "questionText" (string)
- "options" (array of exactly 4 strings)
- "correctOptionIndex" (integer 0 to 3)
- "difficulty" (string: "Easy", "Medium", or "Hard")`;
        }
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        const generated = JSON.parse(response.text);
        if (Array.isArray(generated) && generated.length >= TOTAL_QUESTIONS) {
          finalQuestions = generated.slice(0, TOTAL_QUESTIONS);
          // Save to DB so POST evaluation works seamlessly
          const saveDomain = isJobBased ? (jobTitle || jobSkills.join(', ')) : domainLabel;
          await Question.insertMany(generated.map(q => ({
            domain: saveDomain,
            difficulty: q.difficulty || 'Medium',
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex
          }))).catch(err => console.error("Error saving AI questions to DB:", err));
        }
      } catch (err) {
        console.error("Gemini AI Generation failed:", err);
      }
    }

    // Step 2: Fallback — Use question bank if AI didn't provide enough
    if (finalQuestions.length < TOTAL_QUESTIONS) {
      // Collect domain-specific questions from DB
      const dbQuery = resolvedDomain 
        ? { domain: new RegExp(`^${resolvedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        : { domain: new RegExp(rawDomain, 'i') };
      
      const dbQuestions = await Question.find(dbQuery).limit(200);
      
      // Collect from fallback defaults
      let domainFallbackQuestions = [];
      if (resolvedDomain) {
        domainFallbackQuestions = fallbackQuestions.filter(q => 
          q.domain.toLowerCase() === resolvedDomain.toLowerCase()
        );
      }
      if (domainFallbackQuestions.length === 0) {
        // Try partial match
        domainFallbackQuestions = fallbackQuestions.filter(q => 
          q.domain.toLowerCase().includes(rawDomain.toLowerCase()) || 
          rawDomain.toLowerCase().includes(q.domain.toLowerCase())
        );
      }

      // Merge DB + fallback, deduplicate by questionText
      const allPool = [];
      const seenTexts = new Set(finalQuestions.map(q => q.questionText));
      
      for (const q of dbQuestions) {
        if (!seenTexts.has(q.questionText)) {
          allPool.push({ questionText: q.questionText, options: q.options, difficulty: q.difficulty || 'Medium', correctOptionIndex: q.correctOptionIndex, _id: q._id });
          seenTexts.add(q.questionText);
        }
      }
      for (const q of domainFallbackQuestions) {
        if (!seenTexts.has(q.questionText)) {
          allPool.push(q);
          seenTexts.add(q.questionText);
        }
      }

      // If still not enough, use category fallback
      if (allPool.length + finalQuestions.length < TOTAL_QUESTIONS) {
        const categoryQuestions = fallbackQuestions.filter(q => 
          q.domain === fallbackDomainName
        );
        for (const q of categoryQuestions) {
          if (!seenTexts.has(q.questionText)) {
            allPool.push(q);
            seenTexts.add(q.questionText);
          }
        }
      }

      const needed = TOTAL_QUESTIONS - finalQuestions.length;
      const remainingDist = {
        Easy: Math.max(0, DIFFICULTY_DISTRIBUTION.Easy - finalQuestions.filter(q => q.difficulty === 'Easy').length),
        Medium: Math.max(0, DIFFICULTY_DISTRIBUTION.Medium - finalQuestions.filter(q => q.difficulty === 'Medium').length),
        Hard: Math.max(0, DIFFICULTY_DISTRIBUTION.Hard - finalQuestions.filter(q => q.difficulty === 'Hard').length),
      };

      const selectedFallback = selectQuestions(allPool, previouslyUsedTexts, needed, remainingDist);
      finalQuestions = [...finalQuestions, ...selectedFallback];
    }

    // Final shuffle
    finalQuestions = shuffleArray(finalQuestions).slice(0, TOTAL_QUESTIONS);

    // Strip correctOptionIndex before sending to client
    const clientQuestions = finalQuestions.map((q, idx) => ({
      _id: q._id ? q._id.toString() : `fallback_${idx}`,
      questionText: q.questionText,
      options: q.options,
      domain: isJobBased ? (jobTitle || jobSkills.join(', ')) : (resolvedDomain || rawDomain)
    }));

    return NextResponse.json({
      success: true,
      completed: false,
      questions: clientQuestions,
      studentName: student.userId?.name || student.name || 'Student'
    });

  } catch (error) {
    console.error('Fetch Student Assessment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: Evaluates answers, saves result and updates student score
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const student = await Student.findOne({ userId: decoded.id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      answers, 
      autoSubmitted, 
      violations,
      sessionId,
      browserName,
      browserVersion,
      operatingSystem,
      deviceType,
      screenResolution,
      loginTimestamp,
      tabSwitchCount,
      fullscreenExitCount,
      devtoolsAttemptCount,
      clipboardAttemptCount,
      integrityScore,
      jobId
    } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, message: 'Answers are required' }, { status: 400 });
    }

    let correctCount = 0;
    const totalQuestions = answers.length || TOTAL_QUESTIONS;
    const evaluatedQuestions = [];

    for (const ans of answers) {
      let correctIndex = -1;
      let dbOptions = [];

      // 1. Search in DB
      const dbQ = await Question.findOne({ questionText: ans.questionText });
      if (dbQ) {
        correctIndex = dbQ.correctOptionIndex;
        dbOptions = dbQ.options;
      } else {
        // 2. Search in Fallbacks
        const fallbackQ = fallbackQuestions.find(q => q.questionText === ans.questionText);
        if (fallbackQ) {
          correctIndex = fallbackQ.correctOptionIndex;
          dbOptions = fallbackQ.options;
        }
      }

      let correctOptionText = '';
      if (correctIndex !== -1 && dbOptions && dbOptions.length > correctIndex) {
        correctOptionText = dbOptions[correctIndex];
      }

      // Find client selected option text
      let selectedOptionText = '';
      if (ans.selectedOptionText !== undefined && ans.selectedOptionText !== '') {
        selectedOptionText = ans.selectedOptionText;
      } else if (ans.options && ans.selectedOption !== -1 && ans.options.length > ans.selectedOption) {
        selectedOptionText = ans.options[ans.selectedOption];
      } else if (dbOptions && ans.selectedOption !== -1 && dbOptions.length > ans.selectedOption) {
        selectedOptionText = dbOptions[ans.selectedOption];
      }

      const isCorrect = correctOptionText && selectedOptionText === correctOptionText;
      if (isCorrect) {
        correctCount++;
      }

      evaluatedQuestions.push({
        questionText: ans.questionText,
        options: dbOptions.length > 0 ? dbOptions : (ans.options || []),
        selectedOptionIndex: ans.selectedOption !== undefined ? ans.selectedOption : -1,
        correctOptionIndex: correctIndex,
        isCorrect: !!isCorrect,
        explanation: dbQ?.explanation || '',
        topic: dbQ?.topic || 'General',
        difficulty: dbQ?.difficulty || 'Medium'
      });
    }

    // Scoring Rules: 5 marks per question (20 questions = 100 marks total), 70% passing
    const marksPerQuestion = Math.round(100 / totalQuestions);
    const score = correctCount * marksPerQuestion; 
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passFail = (percentage >= 70 && (violations || 0) < 3) ? 'Pass' : 'Fail';

    const rawDomain = mapDomain(student);
    const domain = resolveDomain(rawDomain) || rawDomain;

    // Calculate time taken
    const loginTime = loginTimestamp ? new Date(loginTimestamp) : new Date();
    const timeTaken = Math.round((new Date() - loginTime) / 1000);

    // Generate feedback
    const feedback = generateFeedback(evaluatedQuestions, percentage, 'medium', timeTaken, totalQuestions, domain);

    const result = await AssessmentResult.create({
      studentId: student._id,
      jobId,
      domain,
      totalQuestions,
      correctAnswers: correctCount,
      score,
      percentage,
      passFail,
      violations: violations || 0,
      autoSubmitted: !!autoSubmitted,
      // Save Audit/Security fields
      sessionId,
      browserName,
      browserVersion,
      operatingSystem,
      deviceType,
      screenResolution,
      loginTimestamp,
      submissionTimestamp: new Date(),
      tabSwitchCount: tabSwitchCount || 0,
      fullscreenExitCount: fullscreenExitCount || 0,
      devtoolsAttemptCount: devtoolsAttemptCount || 0,
      clipboardAttemptCount: clipboardAttemptCount || 0,
      integrityScore: integrityScore !== undefined ? integrityScore : 100,
      // Save report details
      questions: evaluatedQuestions,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
      interviewReadiness: feedback.interviewReadiness,
      confidenceLevel: feedback.confidenceLevel,
      suggestedStudyTime: feedback.suggestedStudyTime,
      overallRecommendation: feedback.overallRecommendation
    });

    // Reset student active session
    student.activeSessionId = null;
    await student.save();

    // Update student's assessment score
    await Student.findByIdAndUpdate(student._id, { $set: { assessmentScore: percentage } });

    // Update student job applications stages if passed
    if (passFail === 'Pass') {
      await JobApplication.updateMany(
        { studentId: student._id, stage: 'Applied' },
        { $set: { stage: 'Assessment Completed' } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      result
    });

  } catch (error) {
    console.error('Submit Assessment Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// FEEDBACK ENGINE — Generates personalized, non-generic feedback for assessment reports
function generateFeedback(evaluatedQuestions, percentage, level, timeTaken, totalQuestions, domain) {
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

  let interviewReadiness = percentage;
  const allTopicsAbove60 = Object.values(topicPerformance).every(p => p >= 60);
  if (allTopicsAbove60 && Object.keys(topicPerformance).length > 2) {
    interviewReadiness = Math.min(100, interviewReadiness + 10);
  }
  const anyTopicZero = Object.values(topicPerformance).some(p => p === 0);
  if (anyTopicZero) {
    interviewReadiness = Math.max(0, interviewReadiness - 15);
  }
  interviewReadiness = Math.round(Math.min(100, Math.max(0, interviewReadiness)));

  let confidenceLevel = 'Low';
  if (percentage >= 90) confidenceLevel = 'Very High';
  else if (percentage >= 75) confidenceLevel = 'High';
  else if (percentage >= 50) confidenceLevel = 'Medium';

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

  const suggestions = [];
  for (const [topic, pct] of Object.entries(topicPerformance)) {
    if (pct < 50) {
      suggestions.push(`Study ${topic} fundamentals in ${domain} — focus on core concepts and practice problems`);
    } else if (pct >= 50 && pct < 80) {
      suggestions.push(`Review advanced ${topic} concepts to strengthen your understanding`);
    }
  }

  if (percentage < 50) {
    suggestions.push(`Focus on building a strong foundation in ${domain} basics before attempting higher levels`);
    suggestions.push('Use structured learning resources like video tutorials and official documentation');
  } else if (percentage < 70) {
    suggestions.push('Practice with hands-on projects to apply theoretical knowledge');
    suggestions.push(`Consider taking mock interviews focused on ${domain}`);
  } else {
    suggestions.push(`Excellent foundation in ${domain} — explore advanced topics and real-world applications`);
  }

  return {
    strengths,
    weaknesses,
    topicPerformance,
    suggestions,
    interviewReadiness,
    confidenceLevel,
    suggestedStudyTime,
    overallRecommendation: percentage >= 70 ? 'Recommended for next stages' : 'Needs improvement before referral'
  };
}
