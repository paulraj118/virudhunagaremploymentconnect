import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import dbConnect from '@/lib/mongodb';

// Helper function to extract programming language from jobRole
function getLanguageFromRole(role) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes('python')) return 'python';
  if (r.includes('java') && !r.includes('javascript')) return 'java';
  if (r.includes('javascript') || r.includes('node') || r.includes('react')) return 'javascript';
  if (r.includes('cpp') || r.includes('c++')) return 'cpp';
  return null;
}

// Helper to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper for escaping regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper for normalizing text to check duplicates
function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Map db question to technical test format
function mapDbQuestionToTestFormat(q) {
  if (q.type === 'MCQ') {
    return {
      question: q.content.questionText,
      options: q.content.options,
      correctOption: q.content.correctAnswer,
      explanation: q.content.explanation || '',
      marks: q.marks || 1
    };
  } else if (q.type === 'FILL_BLANK') {
    return {
      question: q.content.questionText,
      correctAnswer: q.content.correctAnswer,
      marks: q.marks || 1
    };
  } else if (q.type === 'PROGRAMMING') {
    return {
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
    };
  }
}

// POST - Generate Hybrid Technical Test Questions
export async function POST(request) {
  const startTime = Date.now();
  let dbTimeMs = 0;
  let aiTimeMs = 0;
  let duplicateCount = 0;
  let decoded = null;
  let company = null;
  let jobRole = '';
  let customInstructions = '';
  let preferredDomain = '';
  let industryTrack = '';
  let difficultyLevel = '';
  let technologyTags = [];
  let attemptsDetails = [];
  let lastError = null;
  let attempts = 0;
  const maxRetries = 2; // For HTTP errors
  let malformedJsonRetries = 0;
  const maxMalformedJsonRetries = 1;
  let sections = null;

  try {
    decoded = await getCurrentUser();
    if (!decoded || decoded.role !== 'hr_company') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbStart = Date.now();
    await dbConnect();

    // Import AILog dynamically
    let AILog;
    try {
      AILog = (await import('@/models/AILog')).default;
    } catch (e) {
      console.error("Failed to load AILog model", e);
    }

    company = await Company.findOne({ userId: decoded.id });
    dbTimeMs += Date.now() - dbStart;

    const currentStatus = company ? (company.approvalStatus || company.status || '').toLowerCase() : '';
    if (!company || currentStatus !== 'approved') {
      return NextResponse.json({ success: false, message: 'Company not approved' }, { status: 403 });
    }

    const body = await request.json();
    jobRole = body.jobRole;
    customInstructions = body.customInstructions || '';
    preferredDomain = body.preferredDomain || '';
    industryTrack = body.industryTrack || '';
    difficultyLevel = body.difficultyLevel || '';
    technologyTags = body.technologyTags || [];

    if (!jobRole) {
      return NextResponse.json({ success: false, message: 'jobRole is required' }, { status: 400 });
    }

    // Helper for querying MongoDB
    const getMongoQuestions = async (type, limit) => {
      const matchQuery = {
        type,
        status: 'Approved',
        isDeleted: false
      };

      const dom = preferredDomain || jobRole;
      if (dom) {
        matchQuery.$or = [
          { jobRole: { $regex: new RegExp(escapeRegExp(dom), 'i') } },
          { domain: { $regex: new RegExp(escapeRegExp(dom), 'i') } }
        ];
      }

      if (industryTrack) {
        matchQuery.$or = matchQuery.$or || [];
        matchQuery.$or.push({ category: { $regex: new RegExp(escapeRegExp(industryTrack), 'i') } });
        matchQuery.$or.push({ topic: { $regex: new RegExp(escapeRegExp(industryTrack), 'i') } });
      }

      if (difficultyLevel) {
        matchQuery.difficulty = difficultyLevel;
      }

      if (technologyTags && Array.isArray(technologyTags) && technologyTags.length > 0) {
        matchQuery.tags = { $in: technologyTags };
      }

      const lang = getLanguageFromRole(dom);
      if (lang && type === 'PROGRAMMING') {
        matchQuery.language = lang;
      }

      return await QuestionBank.aggregate([
        { $match: matchQuery },
        { $sample: { size: limit } }
      ]);
    };

    const fetchQuestionsWithType = async (type, limit) => {
      let questions = await getMongoQuestions(type, limit);
      if (questions.length < limit) {
        // Relaxed query: Drop difficulty and tags
        const relaxedQuery = {
          type,
          status: 'Approved',
          isDeleted: false
        };
        const dom = preferredDomain || jobRole;
        if (dom) {
          relaxedQuery.$or = [
            { jobRole: { $regex: new RegExp(escapeRegExp(dom), 'i') } },
            { domain: { $regex: new RegExp(escapeRegExp(dom), 'i') } }
          ];
        }
        const lang = getLanguageFromRole(dom);
        if (lang && type === 'PROGRAMMING') {
          relaxedQuery.language = lang;
        }

        const matchedIds = questions.map(q => q._id);
        if (matchedIds.length > 0) {
          relaxedQuery._id = { $nin: matchedIds };
        }

        const additional = await QuestionBank.aggregate([
          { $match: relaxedQuery },
          { $sample: { size: limit - questions.length } }
        ]);
        questions = questions.concat(additional);
      }
      return questions;
    };

    // 1. Fetch from MongoDB
    const qbStart = Date.now();
    const mcqDb = await fetchQuestionsWithType('MCQ', 5);
    const fillDb = await fetchQuestionsWithType('FILL_BLANK', 5);
    const progDb = await fetchQuestionsWithType('PROGRAMMING', 2);
    dbTimeMs += Date.now() - qbStart;

    // Calculate shortage
    const mcqShortage = 5 - mcqDb.length;
    const fillShortage = 5 - fillDb.length;
    const progShortage = 2 - progDb.length;

    let aiMcq = [];
    let aiFill = [];
    let aiProg = [];

    // 2. AI Fallback (Groq call)
    if (mcqShortage > 0 || fillShortage > 0 || progShortage > 0) {
      const GROQ_API_KEY = process.env.GROQ_API_KEY;
      if (!GROQ_API_KEY) {
        return NextResponse.json({ success: false, message: 'AI service not configured. Set GROQ_API_KEY in .env' }, { status: 500 });
      }

      const prompt = `You are an expert technical recruiter. Generate a partial Technical Assessment for the job role: "${jobRole}".

We only need you to generate the missing questions. Generate:
- ${mcqShortage} MCQs (1 mark each)
- ${fillShortage} Fill in the Blanks (1 mark each)
- ${progShortage} Programming Questions (5 marks each)

REQUIREMENTS:
1. Prevent Duplicate Questions & Options: Ensure all questions and options are unique and do not repeat.
2. Question Difficulty Consistency: Generate standard interview-level questions.
3. Return STRICT JSON format ONLY. Do NOT wrap it in Markdown.

The response must follow this EXACT JSON structure. Fill only the arrays/objects that have shortages, and leave the others empty or null:
{
  "sectionA_MCQ": [
    // Provide exactly ${mcqShortage} questions here (or empty array if 0)
    // Structure: { question, options: [4 items], correctOption, explanation, marks: 1 }
  ],
  "sectionB_FillBlanks": [
    // Provide exactly ${fillShortage} questions here (or empty array if 0)
    // Structure: { question, correctAnswer, explanation, marks: 1 }
  ],
  "sectionC_Programming1": ${progShortage >= 1 ? `{
    "title": "Short title",
    "description": "Problem statement",
    "inputFormat": "Input format",
    "outputFormat": "Output format",
    "constraints": "Constraints",
    "supportedLanguages": ["javascript", "python", "java", "cpp"],
    "sampleInput": "5",
    "sampleOutput": "25",
    "hiddenTestCases": [
      { "input": "5", "expectedOutput": "25" },
      { "input": "10", "expectedOutput": "100" },
      { "input": "0", "expectedOutput": "0" },
      { "input": "-3", "expectedOutput": "9" },
      { "input": "1", "expectedOutput": "1" }
    ],
    "marks": 5
  }` : 'null'},
  "sectionD_Programming2": ${progShortage >= 2 ? `{
    "title": "Short title",
    "description": "Problem statement",
    "inputFormat": "Input format",
    "outputFormat": "Output format",
    "constraints": "Constraints",
    "supportedLanguages": ["javascript", "python", "java", "cpp"],
    "sampleInput": "sample",
    "sampleOutput": "sample",
    "hiddenTestCases": [
      { "input": "i1", "expectedOutput": "o1" },
      { "input": "i2", "expectedOutput": "o2" },
      { "input": "i3", "expectedOutput": "o3" },
      { "input": "i4", "expectedOutput": "o4" },
      { "input": "i5", "expectedOutput": "o5" }
    ],
    "marks": 5
  }` : 'null'}
}
${customInstructions ? `\nADDITIONAL INSTRUCTIONS FROM HR:\n${customInstructions}` : ''}`;

      const aiStart = Date.now();
      while (attempts < 5) {
        attempts++;
        let delayMs = 0;
        let httpStatus = 0;
        let retryReason = '';
        let resultStatus = 'Failed';
        let attemptStartTime = Date.now();

        try {
          const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
              })
            }
          );

          httpStatus = response.status;

          if (!response.ok) {
            const errorData = await response.text();
            if ([429, 500, 502, 503, 504].includes(httpStatus)) {
              retryReason = `HTTP ${httpStatus} Error`;
              const retryAfter = response.headers.get('retry-after');
              if (retryAfter) {
                delayMs = parseInt(retryAfter) * 1000;
              } else {
                delayMs = 3000 * Math.pow(2, attempts - 1);
              }
              throw new Error(`Retryable HTTP Error ${httpStatus}: ${errorData}`);
            } else {
              retryReason = `Non-Retryable HTTP ${httpStatus}`;
              throw new Error(`Non-Retryable API Error: ${httpStatus} - ${errorData}`);
            }
          }

          const data = await response.json();
          let generatedText = data.choices?.[0]?.message?.content;
          
          if (!generatedText) {
            retryReason = 'Empty Response';
            throw new Error('AI returned empty response.');
          }

          generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          try {
            sections = JSON.parse(generatedText);
          } catch (jsonErr) {
            retryReason = 'Malformed JSON';
            throw new Error(`JSON Parse Error: ${jsonErr.message}`);
          }

          // Validation Engine
          try {
            if (mcqShortage > 0) {
              if (!sections.sectionA_MCQ || !Array.isArray(sections.sectionA_MCQ) || sections.sectionA_MCQ.length !== mcqShortage) {
                throw new Error(`Validation Failed: AI did not generate exactly ${mcqShortage} MCQs.`);
              }
              for (const mcq of sections.sectionA_MCQ) {
                if (!mcq.options || !Array.isArray(mcq.options) || mcq.options.length !== 4) {
                  throw new Error('Validation Failed: MCQ does not have exactly 4 options.');
                }
              }
            }

            if (fillShortage > 0) {
              if (!sections.sectionB_FillBlanks || !Array.isArray(sections.sectionB_FillBlanks) || sections.sectionB_FillBlanks.length !== fillShortage) {
                throw new Error(`Validation Failed: AI did not generate exactly ${fillShortage} Fill-in-the-Blanks.`);
              }
            }

            if (progShortage >= 1) {
              if (!sections.sectionC_Programming1 || !sections.sectionC_Programming1.title || !sections.sectionC_Programming1.inputFormat) {
                throw new Error('Validation Failed: Programming Question 1 is missing required fields.');
              }
              if (!sections.sectionC_Programming1.hiddenTestCases || !Array.isArray(sections.sectionC_Programming1.hiddenTestCases) || sections.sectionC_Programming1.hiddenTestCases.length !== 5) {
                 throw new Error('Validation Failed: Programming Question 1 does not have exactly 5 hidden test cases.');
              }
            }

            if (progShortage >= 2) {
              if (!sections.sectionD_Programming2 || !sections.sectionD_Programming2.title || !sections.sectionD_Programming2.inputFormat) {
                throw new Error('Validation Failed: Programming Question 2 is missing required fields.');
              }
              if (!sections.sectionD_Programming2.hiddenTestCases || !Array.isArray(sections.sectionD_Programming2.hiddenTestCases) || sections.sectionD_Programming2.hiddenTestCases.length !== 5) {
                 throw new Error('Validation Failed: Programming Question 2 does not have exactly 5 hidden test cases.');
              }
            }
          } catch (validationErr) {
            retryReason = 'Validation Failure';
            sections = null;
            throw validationErr;
          }

          resultStatus = 'Success';
          attemptsDetails.push({
            attemptNumber: attempts,
            httpStatus: httpStatus,
            retryReason: 'None',
            delayMs: 0,
            durationMs: Date.now() - attemptStartTime,
            result: resultStatus
          });
          break;

        } catch (err) {
          lastError = err;
          console.error(`Attempt ${attempts} Failed:`, err.message);

          let willRetry = false;
          if (err.message.startsWith('Retryable HTTP Error') || err.message === 'AI returned empty response.' || err.name === 'TypeError' || err.message.includes('fetch failed')) { 
            if (attempts <= maxRetries) {
              willRetry = true;
              if (delayMs === 0) delayMs = 3000 * Math.pow(2, attempts - 1);
            }
          } else if (err.message.startsWith('JSON Parse Error')) {
            if (malformedJsonRetries < maxMalformedJsonRetries) {
              willRetry = true;
              malformedJsonRetries++;
              delayMs = 2000;
            }
          }

          attemptsDetails.push({
            attemptNumber: attempts,
            httpStatus: httpStatus || 0,
            retryReason: retryReason || (err.name === 'TypeError' ? 'Network Timeout' : 'Unknown'),
            delayMs: willRetry ? delayMs : 0,
            durationMs: Date.now() - attemptStartTime,
            result: 'Failed'
          });

          if (willRetry) {
            await new Promise(res => setTimeout(res, delayMs));
          } else {
            break;
          }
        }
      }
      aiTimeMs = Date.now() - aiStart;
    }

    if (mcqShortage > 0 || fillShortage > 0 || progShortage > 0) {
      if (!sections) {
        return NextResponse.json({ success: false, message: 'AI generation failed: ' + (lastError?.message || 'Unknown Error') }, { status: 502 });
      }
      aiMcq = sections.sectionA_MCQ || [];
      aiFill = sections.sectionB_FillBlanks || [];
      if (sections.sectionC_Programming1 && Object.keys(sections.sectionC_Programming1).length > 0) {
        aiProg.push(sections.sectionC_Programming1);
      }
      if (sections.sectionD_Programming2 && Object.keys(sections.sectionD_Programming2).length > 0) {
        aiProg.push(sections.sectionD_Programming2);
      }
    }

    // 3. Save AI Questions back to QuestionBank with duplicate prevention
    const aiQuestionsSaved = [];
    const saveStart = Date.now();
    const dom = preferredDomain || jobRole;
    const lang = getLanguageFromRole(dom);

    // Helper to check duplicate
    const isDuplicateQuestion = async (type, rawText, title) => {
      const duplicateQuery = {
        isDeleted: false,
        type,
        $or: [{ companyId: company._id }, { companyId: null }]
      };
      
      if (type === 'MCQ' || type === 'FILL_BLANK') {
        const norm = normalizeText(rawText);
        const list = await QuestionBank.find(duplicateQuery);
        for (const q of list) {
          if (normalizeText(q.content?.questionText) === norm) {
            return true;
          }
        }
      } else if (type === 'PROGRAMMING') {
        duplicateQuery['content.title'] = { $regex: new RegExp(`^${escapeRegExp(title)}$`, 'i') };
        const match = await QuestionBank.findOne(duplicateQuery);
        if (match) return true;
      }
      return false;
    };

    // Save MCQs
    for (const mcq of aiMcq) {
      const duplicate = await isDuplicateQuestion('MCQ', mcq.question, '');
      if (duplicate) {
        duplicateCount++;
        continue;
      }
      const qDoc = await QuestionBank.create({
        companyId: company._id,
        jobRole,
        category: industryTrack || 'Technical',
        type: 'MCQ',
        tags: [jobRole],
        content: {
          questionText: mcq.question,
          options: mcq.options,
          correctAnswer: mcq.correctOption,
          explanation: mcq.explanation
        },
        marks: 1,
        source: 'AI',
        approved: false,
        status: 'Pending Review',
        usageCount: 0,
        createdBy: decoded.id
      });
      aiQuestionsSaved.push(qDoc);
    }

    // Save Fills
    for (const fill of aiFill) {
      const duplicate = await isDuplicateQuestion('FILL_BLANK', fill.question, '');
      if (duplicate) {
        duplicateCount++;
        continue;
      }
      const qDoc = await QuestionBank.create({
        companyId: company._id,
        jobRole,
        category: industryTrack || 'Technical',
        type: 'FILL_BLANK',
        tags: [jobRole],
        content: {
          questionText: fill.question,
          correctAnswer: fill.correctAnswer,
          explanation: fill.explanation
        },
        marks: 1,
        source: 'AI',
        approved: false,
        status: 'Pending Review',
        usageCount: 0,
        createdBy: decoded.id
      });
      aiQuestionsSaved.push(qDoc);
    }

    // Save Programmings
    for (const prog of aiProg) {
      const duplicate = await isDuplicateQuestion('PROGRAMMING', '', prog.title);
      if (duplicate) {
        duplicateCount++;
        continue;
      }
      const qDoc = await QuestionBank.create({
        companyId: company._id,
        jobRole,
        category: industryTrack || 'Technical',
        type: 'PROGRAMMING',
        language: lang || 'javascript',
        tags: [jobRole],
        content: {
          title: prog.title,
          problemStatement: prog.description,
          inputFormat: prog.inputFormat,
          outputFormat: prog.outputFormat,
          constraints: prog.constraints,
          sampleInput: typeof prog.sampleInput === 'object' ? JSON.stringify(prog.sampleInput) : String(prog.sampleInput || ''),
          sampleOutput: typeof prog.sampleOutput === 'object' ? JSON.stringify(prog.sampleOutput) : String(prog.sampleOutput || ''),
          hiddenTestCases: (prog.hiddenTestCases || []).map(tc => ({
            input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input || ''),
            expectedOutput: typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput || '')
          })),
          starterCode: prog.starterCode || ''
        },
        marks: 5,
        source: 'AI',
        approved: false,
        status: 'Pending Review',
        usageCount: 0,
        createdBy: decoded.id
      });
      aiQuestionsSaved.push(qDoc);
    }
    dbTimeMs += Date.now() - saveStart;

    // 4. Update usageCount & lastUsedAt for MongoDB questions
    if (mcqDb.length > 0 || fillDb.length > 0 || progDb.length > 0) {
      const incrementStart = Date.now();
      const allSelectedDbIds = [
        ...mcqDb.map(q => q._id),
        ...fillDb.map(q => q._id),
        ...progDb.map(q => q._id)
      ];
      await QuestionBank.updateMany(
        { _id: { $in: allSelectedDbIds } },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date() }
        }
      );
      dbTimeMs += Date.now() - incrementStart;
    }

    // 5. Merge and Shuffle Questions
    const finalMCQs = shuffleArray([
      ...mcqDb.map(q => mapDbQuestionToTestFormat(q)),
      ...aiMcq
    ]);
    const finalFills = shuffleArray([
      ...fillDb.map(q => mapDbQuestionToTestFormat(q)),
      ...aiFill
    ]);
    const finalProgs = shuffleArray([
      ...progDb.map(q => mapDbQuestionToTestFormat(q)),
      ...aiProg
    ]);

    const finalSections = {
      sectionA_MCQ: finalMCQs,
      sectionB_FillBlanks: finalFills,
      sectionC_Programming1: finalProgs[0],
      sectionD_Programming2: finalProgs[1]
    };

    const totalExecutionTimeMs = Date.now() - startTime;

    // 6. Logging to AILog
    if (AILog) {
      await AILog.create({
        jobRole,
        promptUsed: mcqShortage > 0 || fillShortage > 0 || progShortage > 0 ? 'AI Hybrid Prompt' : 'None (Fetched completely from Database)',
        customInstructions: customInstructions || '',
        generatedBy: decoded.id,
        success: true,
        retries: attempts - 1,
        errorMessage: '',
        attemptsDetails,
        totalExecutionTimeMs,
        mongoQuestionsCount: mcqDb.length + fillDb.length + progDb.length,
        aiQuestionsCount: aiMcq.length + aiFill.length + aiProg.length,
        finalStatus: 'Success'
      });
    }

    // 7. Backward-compatible JSON response
    return NextResponse.json({
      success: true,
      source: (aiMcq.length + aiFill.length + aiProg.length) > 0 ? 'hybrid' : 'database',
      totalQuestions: 12,
      databaseQuestions: mcqDb.length + fillDb.length + progDb.length,
      aiQuestions: aiMcq.length + aiFill.length + aiProg.length,
      technicalTest: {
        companyId: company._id,
        hrId: decoded.id,
        jobRole,
        totalMarks: 20,
        sections: finalSections
      },
      sections: finalSections, // Crucial for UI
      message: `Technical Test questions generated for "${jobRole}"`
    });

  } catch (error) {
    console.error('Hybrid Generate Questions Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during AI generation' }, { status: 500 });
  }
}
