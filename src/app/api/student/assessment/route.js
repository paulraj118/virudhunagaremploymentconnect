import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Question from '@/models/Question';
import AssessmentResult from '@/models/AssessmentResult';
import JobApplication from '@/models/JobApplication';
import { getCurrentUser } from '@/lib/auth';
import { fallbackQuestions } from '@/lib/assessmentDefaults';

// Helper to map student preferred domain to question domains
function mapDomain(student) {
  if (student.preferredDomain) return student.preferredDomain;
  if (student.skills && student.skills.length > 0) return student.skills[0];
  return 'General';
}

// GET: Returns proctored assessment questions
export async function GET(request) {
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

    if (student.enrollmentStatus !== 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Your profile is pending approval. You can start the assessment once approved.'
      }, { status: 403 });
    }

    // Check if they already have an assessment result
    const existingResult = await AssessmentResult.findOne({ studentId: student._id }).sort({ createdAt: -1 });
    if (existingResult) {
      return NextResponse.json({
        success: true,
        completed: true,
        result: existingResult
      });
    }

    const preferredDomain = mapDomain(student);
    let finalQuestions = [];

    // AI Question Generation using Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Generate exactly 10 beginner-level multiple choice questions for the skill: ${preferredDomain}. Return ONLY a raw JSON array of objects. Each object must have exactly these fields: "questionText" (string), "options" (array of exactly 4 strings), and "correctOptionIndex" (integer 0 to 3).`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        const generated = JSON.parse(response.text);
        if (Array.isArray(generated) && generated.length === 10) {
          finalQuestions = generated;
          // Save to DB so POST evaluation works seamlessly
          await Question.insertMany(generated.map(q => ({
            domain: preferredDomain,
            difficulty: 'Easy',
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex
          }))).catch(err => console.error("Error saving AI questions to DB:", err));
        }
      } catch (err) {
        console.error("Gemini AI Generation failed:", err);
      }
    }

    // Fallback if AI fails or key is missing
    if (finalQuestions.length < 10) {
      const dbPreferredQuestions = await Question.find({ domain: new RegExp(preferredDomain, 'i') }).limit(10);
      if (dbPreferredQuestions.length >= 10) {
        finalQuestions = dbPreferredQuestions;
      } else {
        // Ultimate fallback to existing questions in the defaults
        const fbQs = fallbackQuestions.filter(q => q.domain.toLowerCase().includes(preferredDomain.toLowerCase()));
        finalQuestions = [...dbPreferredQuestions, ...fbQs, ...fallbackQuestions].slice(0, 10);
      }
    }

    // Strip correctOptionIndex before sending to client
    const clientQuestions = finalQuestions.map((q, idx) => ({
      _id: q._id ? q._id.toString() : `fallback_${idx}`,
      questionText: q.questionText,
      options: q.options,
      domain: preferredDomain
    }));

    return NextResponse.json({
      success: true,
      completed: false,
      questions: clientQuestions
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
    const { answers, autoSubmitted, violations } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, message: 'Answers are required' }, { status: 400 });
    }

    let correctCount = 0;
    const totalQuestions = answers.length || 10;

    for (const ans of answers) {
      let correctIndex = -1;

      // 1. Search in DB
      const dbQ = await Question.findOne({ questionText: ans.questionText });
      if (dbQ) {
        correctIndex = dbQ.correctOptionIndex;
      } else {
        // 2. Search in Fallbacks
        const fallbackQ = fallbackQuestions.find(q => q.questionText === ans.questionText);
        if (fallbackQ) {
          correctIndex = fallbackQ.correctOptionIndex;
        }
      }

      if (correctIndex !== -1 && ans.selectedOption === correctIndex) {
        correctCount++;
      }
    }

    // Scoring Rules: 10 marks per question, 70% passing
    const score = correctCount * 10; 
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passFail = (percentage >= 70 && (violations || 0) < 3) ? 'Pass' : 'Fail';

    const domain = mapDomain(student);
    const result = await AssessmentResult.create({
      studentId: student._id,
      domain,
      totalQuestions,
      correctAnswers: correctCount,
      score,
      percentage,
      passFail,
      violations: violations || 0,
      autoSubmitted: !!autoSubmitted
    });

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
