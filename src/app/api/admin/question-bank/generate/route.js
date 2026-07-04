import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuestionBank from '@/models/QuestionBank';
import { getCurrentUser } from '@/lib/auth';

export const maxDuration = 60; // 60 seconds timeout for AI generation

function getLanguageFromRole(role) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes('python')) return 'python';
  if (r.includes('java') && !r.includes('javascript')) return 'java';
  if (r.includes('javascript') || r.includes('node') || r.includes('react')) return 'javascript';
  if (r.includes('cpp') || r.includes('c++')) return 'cpp';
  return null;
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded || !['super_admin', 'admin', 'hr_company'].includes(decoded.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { jobRole, customInstructions = '', difficulty = 'Medium', domain = '' } = await request.json();

    if (!jobRole) {
      return NextResponse.json({ success: false, message: 'Job Role is required' }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ success: false, message: 'GROQ_API_KEY is not set in environment variables.' }, { status: 500 });
    }

    const prompt = `You are an expert technical recruiter and software engineer. Generate a highly professional Technical Assessment test bank for the job role: "${jobRole}".

Generate EXACTLY:
- 5 Multiple Choice Questions (MCQs)
- 5 Fill in the Blanks
- 2 Programming Questions

REQUIREMENTS:
1. The questions must evaluate real-world skills suitable for a "${difficulty}" level candidate.
2. Ensure no duplicates. All questions must be strictly related to "${jobRole}" and domain "${domain}".
3. Provide the response STRICTLY as a JSON object, WITHOUT markdown formatting or backticks.

The response MUST exactly follow this JSON schema:
{
  "MCQ": [
    { "question": "Question text?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "correctOption": "Option 2", "explanation": "Why this is correct" }
  ],
  "FILL_BLANK": [
    { "question": "The ___ keyword is used to declare a constant.", "correctAnswer": "const", "explanation": "const is used for constants" }
  ],
  "PROGRAMMING": [
    {
      "title": "Short title",
      "description": "Clear problem statement",
      "inputFormat": "Input format description",
      "outputFormat": "Output format description",
      "constraints": "Constraints description",
      "sampleInput": "sample string or number",
      "sampleOutput": "sample output",
      "hiddenTestCases": [
        { "input": "input1", "expectedOutput": "output1" },
        { "input": "input2", "expectedOutput": "output2" },
        { "input": "input3", "expectedOutput": "output3" },
        { "input": "input4", "expectedOutput": "output4" },
        { "input": "input5", "expectedOutput": "output5" }
      ]
    }
  ]
}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ''}
`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!groqRes.ok) {
      const errTxt = await groqRes.text();
      console.error('Groq API Error:', errTxt);
      return NextResponse.json({ success: false, message: 'Failed to generate questions with Groq AI.' }, { status: 500 });
    }

    const aiData = await groqRes.json();
    let resultJson;
    try {
      resultJson = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Failed to parse AI response as JSON.' }, { status: 500 });
    }

    await dbConnect();
    
    const baseFields = {
      companyId: null,
      jobRole,
      category: domain || jobRole,
      tags: [jobRole],
      status: 'Approved',
      isAiGenerated: true,
      createdBy: decoded.id,
      difficulty,
      domain: domain || jobRole,
      source: 'AI Bulk Generator'
    };

    const language = getLanguageFromRole(jobRole);
    const documentsToInsert = [];

    // Parse MCQs
    if (resultJson.MCQ && Array.isArray(resultJson.MCQ)) {
      for (const q of resultJson.MCQ) {
        if (!q.question || !q.options || !q.correctOption) continue;
        documentsToInsert.push({
          ...baseFields,
          type: 'MCQ',
          content: {
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctOption,
            explanation: q.explanation || ''
          },
          marks: 1
        });
      }
    }

    // Parse Fill Blanks
    if (resultJson.FILL_BLANK && Array.isArray(resultJson.FILL_BLANK)) {
      for (const q of resultJson.FILL_BLANK) {
        if (!q.question || !q.correctAnswer) continue;
        documentsToInsert.push({
          ...baseFields,
          type: 'FILL_BLANK',
          content: {
            questionText: q.question,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ''
          },
          marks: 1
        });
      }
    }

    // Parse Programming
    if (resultJson.PROGRAMMING && Array.isArray(resultJson.PROGRAMMING)) {
      for (const q of resultJson.PROGRAMMING) {
        if (!q.title || !q.description) continue;
        documentsToInsert.push({
          ...baseFields,
          type: 'PROGRAMMING',
          language,
          content: {
            title: q.title,
            problemStatement: q.description,
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            constraints: q.constraints || '',
            sampleInput: q.sampleInput || '',
            sampleOutput: q.sampleOutput || '',
            hiddenTestCases: q.hiddenTestCases || [],
            starterCode: ''
          },
          marks: 5
        });
      }
    }

    if (documentsToInsert.length === 0) {
      return NextResponse.json({ success: false, message: 'AI did not return any valid questions.' }, { status: 400 });
    }

    await QuestionBank.insertMany(documentsToInsert);

    const mcqs = documentsToInsert.filter(d => d.type === 'MCQ').map(q => ({
      question: q.content.questionText,
      options: q.content.options,
      correctOption: q.content.correctAnswer,
      explanation: q.content.explanation || '',
      marks: q.marks || 1
    }));

    const fills = documentsToInsert.filter(d => d.type === 'FILL_BLANK').map(q => ({
      question: q.content.questionText,
      correctAnswer: q.content.correctAnswer,
      marks: q.marks || 1
    }));

    const progs = documentsToInsert.filter(d => d.type === 'PROGRAMMING').map(q => ({
      title: q.content.title || '',
      description: q.content.problemStatement || '',
      inputFormat: q.content.inputFormat || '',
      outputFormat: q.content.outputFormat || '',
      constraints: q.content.constraints || '',
      supportedLanguages: q.content.supportedLanguages || ['javascript', 'python', 'java', 'cpp'],
      sampleInput: q.content.sampleInput || '',
      sampleOutput: q.content.sampleOutput || '',
      hiddenTestCases: (q.content.hiddenTestCases || []).map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      })),
      starterCode: q.content.starterCode || '',
      marks: q.marks || 5
    }));

    const sections = {
      sectionA_MCQ: mcqs,
      sectionB_FillBlanks: fills,
      sectionC_Programming1: progs[0] || null,
      sectionD_Programming2: progs[1] || null
    };

    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated and saved ${documentsToInsert.length} questions to the database.`,
      sections
    });

  } catch (error) {
    console.error('AI Bulk Generation Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
