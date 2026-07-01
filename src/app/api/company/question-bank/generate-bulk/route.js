import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Company from '@/models/Company';
import QuestionBank from '@/models/QuestionBank';
import dbConnect from '@/lib/mongodb';

// Normalize text for duplicate detection
function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Domain-specific topics for interview questions
const DOMAIN_TOPICS = {
  'Python': ['Variables', 'Data Types', 'Operators', 'Strings', 'Lists', 'Tuples', 'Dictionaries', 'Sets', 'Functions', 'Loops', 'Conditional Statements', 'OOP Basics', 'Exception Handling', 'File Handling', 'Modules', 'Basic Programs'],
  'Java': ['Variables', 'OOP', 'Loops', 'Arrays', 'Strings', 'Classes', 'Constructors', 'Inheritance', 'Polymorphism', 'Interfaces', 'Exception Handling', 'Collections Basics', 'Multithreading Basics'],
  'JavaScript': ['Variables', 'Data Types', 'Functions', 'Arrays', 'Objects', 'DOM', 'Events', 'Promises', 'Async/Await', 'ES6 Features', 'Closures', 'Scope', 'Hoisting', 'Callbacks'],
  'React': ['Components', 'Props', 'State', 'Hooks', 'Events', 'Forms', 'Routing Basics', 'useEffect', 'useState', 'Context API', 'JSX', 'Lifecycle', 'Conditional Rendering'],
  'Node.js': ['Modules', 'npm', 'File System', 'HTTP Server', 'Express Basics', 'Middleware', 'REST API', 'Routing', 'Events', 'Streams', 'Error Handling'],
  'SQL': ['SELECT', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'Aggregate Functions', 'Subqueries', 'INSERT', 'UPDATE', 'DELETE', 'Normalization', 'Keys', 'Indexes'],
  'MongoDB': ['Documents', 'Collections', 'CRUD', 'find', 'Aggregation', 'Indexes', 'Schema Design', 'Mongoose Basics', 'Operators', 'Projection'],
  'C': ['Variables', 'Data Types', 'Operators', 'Control Flow', 'Loops', 'Arrays', 'Strings', 'Pointers', 'Functions', 'Structures', 'File I/O', 'Memory Management'],
  'C++': ['Variables', 'OOP', 'Classes', 'Inheritance', 'Polymorphism', 'Templates', 'STL Basics', 'Pointers', 'References', 'Exception Handling', 'Constructors', 'Destructors'],
  'HTML': ['Elements', 'Attributes', 'Forms', 'Tables', 'Semantic Tags', 'Media', 'Links', 'Lists', 'Input Types', 'HTML5 Features', 'Accessibility'],
  'CSS': ['Selectors', 'Box Model', 'Flexbox', 'Grid', 'Positioning', 'Colors', 'Typography', 'Responsive Design', 'Media Queries', 'Animations', 'Transitions'],
  'Data Structures': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Binary Search Trees', 'Sorting', 'Searching', 'Hashing', 'Graphs Basics', 'Recursion', 'Time Complexity'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Regression', 'Classification', 'Clustering', 'Decision Trees', 'Random Forest', 'SVM', 'Neural Networks Basics', 'Evaluation Metrics', 'Overfitting', 'Feature Engineering'],
  'Data Science': ['Data Cleaning', 'EDA', 'Pandas', 'NumPy', 'Visualization', 'Statistics Basics', 'Probability', 'Correlation', 'Hypothesis Testing', 'Regression Analysis'],
  'Power BI': ['Dashboards', 'Reports', 'DAX Basics', 'Data Modeling', 'Visualizations', 'Filters', 'Slicers', 'Power Query', 'Data Sources', 'Relationships'],
  'R Programming': ['Variables', 'Data Types', 'Vectors', 'Data Frames', 'Functions', 'Loops', 'ggplot2 Basics', 'Statistical Functions', 'Packages', 'Data Manipulation'],
  'AWS': ['EC2', 'S3', 'IAM', 'Lambda', 'RDS', 'VPC', 'CloudWatch', 'DynamoDB', 'SNS', 'SQS', 'Elastic Beanstalk'],
  'Azure': ['Virtual Machines', 'App Service', 'Blob Storage', 'Azure Functions', 'SQL Database', 'Active Directory', 'DevOps Basics', 'Resource Groups', 'Networking'],
  'Docker': ['Containers', 'Images', 'Dockerfile', 'Docker Compose', 'Volumes', 'Networking', 'Registry', 'Commands', 'Layers', 'Multi-stage Builds'],
  'Kubernetes': ['Pods', 'Deployments', 'Services', 'Namespaces', 'ConfigMaps', 'Secrets', 'Ingress', 'kubectl Commands', 'Scaling', 'Architecture'],
  'Cyber Security': ['CIA Triad', 'Encryption', 'Firewalls', 'Malware Types', 'Authentication', 'Authorization', 'SQL Injection', 'XSS', 'HTTPS/SSL', 'Network Security', 'Social Engineering'],
  'Flutter': ['Widgets', 'State Management', 'Layouts', 'Navigation', 'Hot Reload', 'Dart Basics', 'Scaffold', 'ListView', 'Forms', 'Packages'],
  'Android': ['Activities', 'Intents', 'Layouts', 'Views', 'RecyclerView', 'Fragments', 'SharedPreferences', 'SQLite', 'Permissions', 'Lifecycle']
};

// Build Gemini prompt for a batch
function buildPrompt(domain, topic, questionTypes, batchSize) {
  const mcqCount = questionTypes.includes('MCQ') ? Math.ceil(batchSize * 0.4) : 0;
  const fillCount = questionTypes.includes('FILL_BLANK') ? Math.ceil(batchSize * 0.3) : 0;
  const progCount = questionTypes.includes('PROGRAMMING') ? Math.max(1, Math.floor(batchSize * 0.3)) : 0;

  const actualTotal = mcqCount + fillCount + progCount;
  const topicInstruction = topic ? `Focus specifically on the topic: "${topic}".` : `Cover a variety of fundamental interview-oriented topics for ${domain}.`;

  return {
    prompt: `You are an expert technical interviewer preparing standard placement interview questions for freshers and campus recruitment.

Domain: ${domain}
${topicInstruction}

Generate exactly:
- ${mcqCount} MCQ questions (4 options each, one correct answer)
- ${fillCount} Fill in the Blank questions
- ${progCount} Programming questions

RULES:
1. All questions must be standard interview level suitable for freshers.
2. Do NOT classify questions by difficulty (Easy/Medium/Hard).
3. Each question must be unique and not repeat.
4. MCQs must have exactly 4 options labeled A, B, C, D.
5. Programming questions must have input format, output format, constraints, sample I/O, and 5 hidden test cases.
6. Return STRICT JSON format ONLY. No markdown wrapping.

Return this exact JSON structure:
{
  "questions": [
    {
      "questionType": "MCQ",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Brief explanation",
      "topic": "specific topic name"
    },
    {
      "questionType": "FILL_BLANK",
      "question": "The _____ keyword is used to define a function in Python.",
      "correctAnswer": "def",
      "explanation": "Brief explanation",
      "topic": "specific topic name"
    },
    {
      "questionType": "PROGRAMMING",
      "question": "Problem title",
      "problemStatement": "Detailed problem description",
      "inputFormat": "Input format description",
      "outputFormat": "Output format description",
      "constraints": "1 <= N <= 1000",
      "sampleInput": "5",
      "sampleOutput": "25",
      "hiddenTestCases": [
        {"input": "5", "expectedOutput": "25"},
        {"input": "10", "expectedOutput": "100"},
        {"input": "0", "expectedOutput": "0"},
        {"input": "1", "expectedOutput": "1"},
        {"input": "100", "expectedOutput": "10000"}
      ],
      "explanation": "Brief explanation",
      "topic": "specific topic name"
    }
  ]
}`,
    expectedCounts: { mcq: mcqCount, fill: fillCount, prog: progCount, total: actualTotal }
  };
}

// POST - Bulk generate questions with batch processing
export async function POST(request) {
  const startTime = Date.now();

  try {
    const decoded = await getCurrentUser();
    if (!decoded || (decoded.role !== 'hr_company' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let companyId = null;
    if (decoded.role === 'hr_company') {
      const company = await Company.findOne({ userId: decoded.id });
      if (!company) return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
      companyId = company._id;
    }

    const body = await request.json();
    const { domain, topic, questionCount, questionTypes } = body;

    if (!domain || !questionCount || !questionTypes || questionTypes.length === 0) {
      return NextResponse.json({ success: false, message: 'domain, questionCount, and questionTypes are required' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: false, message: 'Gemini API key not configured' }, { status: 500 });
    }

    const BATCH_SIZE = 20;
    const totalBatches = Math.ceil(questionCount / BATCH_SIZE);
    let totalGenerated = 0;
    let totalSaved = 0;
    let totalDuplicates = 0;
    let totalFailed = 0;
    const batchResults = [];

    // Process in batches
    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const remaining = questionCount - totalGenerated;
      const currentBatchSize = Math.min(BATCH_SIZE, remaining);

      if (currentBatchSize <= 0) break;

      const { prompt, expectedCounts } = buildPrompt(domain, topic, questionTypes, currentBatchSize);

      let batchSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      let batchSaved = 0;
      let batchDuplicates = 0;
      let batchGenerated = 0;

      while (!batchSuccess && retryCount <= maxRetries) {
        try {
          // Exponential backoff delay for retries
          if (retryCount > 0) {
            const delay = Math.min(2000 * Math.pow(2, retryCount), 30000);
            await new Promise(res => setTimeout(res, delay));
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.8,
                  maxOutputTokens: 8192,
                  responseMimeType: 'application/json'
                }
              })
            }
          );

          if (response.status === 429) {
            if (retryCount >= maxRetries) {
              throw new Error('Rate limit exceeded max retries');
            }
            retryCount++;
            const retryAfter = response.headers.get('retry-after');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * Math.pow(2, retryCount);
            console.log(`Rate limited. Waiting ${delay}ms before retry ${retryCount}...`);
            await new Promise(res => setTimeout(res, delay));
            continue;
          }

          if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
          }

          const data = await response.json();
          let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!generatedText) {
            throw new Error('Empty response from Gemini');
          }

          generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(generatedText);
          const questions = parsed.questions || [];

          batchGenerated = questions.length;
          totalGenerated += batchGenerated;

          // Save each question immediately with duplicate detection
          for (const q of questions) {
            try {
              const isDuplicate = await checkDuplicate(q, companyId);
              if (isDuplicate) {
                batchDuplicates++;
                totalDuplicates++;
                continue;
              }

              const questionDoc = mapToQuestionBankDoc(q, domain, companyId, decoded.id);
              await QuestionBank.create(questionDoc);
              batchSaved++;
              totalSaved++;
            } catch (saveErr) {
              console.error('Save error for question:', saveErr.message);
              totalFailed++;
            }
          }

          batchSuccess = true;

        } catch (err) {
          console.error(`Batch ${batchNum} attempt ${retryCount + 1} failed:`, err.message);
          
          if (retryCount >= maxRetries) {
            totalFailed += currentBatchSize;
            batchResults.push({
              batch: batchNum,
              status: 'failed',
              error: err.message,
              generated: 0,
              saved: 0,
              duplicates: 0
            });
            break; // Stop retrying this batch
          } else {
            retryCount++;
          }
        }
      }

      if (batchSuccess) {
        batchResults.push({
          batch: batchNum,
          status: 'success',
          generated: batchGenerated,
          saved: batchSaved,
          duplicates: batchDuplicates
        });
      }

      // Small delay between batches to respect rate limits
      if (batchNum < totalBatches) {
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    const timeTaken = Date.now() - startTime;

    // Log to AILog
    try {
      const AILog = (await import('@/models/AILog')).default;
      await AILog.create({
        jobRole: domain,
        promptUsed: `Bulk Question Bank Generation: ${domain}`,
        customInstructions: topic || '',
        generatedBy: decoded.id,
        success: totalSaved > 0,
        retries: batchResults.filter(b => b.status === 'failed').length,
        errorMessage: totalFailed > 0 ? `${totalFailed} questions failed` : '',
        totalExecutionTimeMs: timeTaken,
        mongoQuestionsCount: totalSaved,
        aiQuestionsCount: totalGenerated,
        finalStatus: totalSaved > 0 ? 'Success' : 'Failed'
      });
    } catch (logErr) {
      console.error('AILog save error:', logErr.message);
    }

    return NextResponse.json({
      success: true,
      summary: {
        requested: questionCount,
        generated: totalGenerated,
        saved: totalSaved,
        duplicatesSkipped: totalDuplicates,
        failed: totalFailed,
        timeTakenMs: timeTaken,
        timeTakenFormatted: `${Math.round(timeTaken / 1000)}s`,
        batches: batchResults
      }
    });

  } catch (error) {
    console.error('Bulk Generate Error:', error);
    return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: 500 });
  }
}

// Check if a question is a duplicate
async function checkDuplicate(q, companyId) {
  const baseQuery = { isDeleted: false };
  if (companyId) {
    baseQuery.$or = [{ companyId }, { companyId: null }];
  }

  if (q.questionType === 'MCQ' || q.questionType === 'FILL_BLANK') {
    const norm = normalizeText(q.question);
    if (!norm) return false;

    const candidates = await QuestionBank.find({
      ...baseQuery,
      type: q.questionType === 'MCQ' ? 'MCQ' : 'FILL_BLANK'
    }).select('content.questionText').lean();

    for (const c of candidates) {
      if (normalizeText(c.content?.questionText) === norm) {
        return true;
      }
    }
  } else if (q.questionType === 'PROGRAMMING') {
    const title = q.question || q.problemStatement;
    if (!title) return false;

    const existing = await QuestionBank.findOne({
      ...baseQuery,
      type: 'PROGRAMMING',
      'content.title': { $regex: new RegExp(`^${escapeRegExp(title.trim())}$`, 'i') }
    });
    return !!existing;
  }

  return false;
}

// Map AI question to QuestionBank document
function mapToQuestionBankDoc(q, domain, companyId, userId) {
  const base = {
    companyId,
    jobRole: domain,
    category: 'Technical',
    tags: [domain, q.topic || ''].filter(Boolean),
    domain,
    topic: q.topic || '',
    source: 'AI',
    approved: false,
    status: 'Pending Review',
    isAiGenerated: true,
    usageCount: 0,
    lastUsedAt: null,
    createdBy: userId,
    marks: 1,
    versionHistory: [{
      version: 1,
      previousContent: null,
      editedBy: userId,
      editedAt: new Date()
    }]
  };

  if (q.questionType === 'MCQ') {
    return {
      ...base,
      type: 'MCQ',
      content: {
        questionText: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }
    };
  } else if (q.questionType === 'FILL_BLANK') {
    return {
      ...base,
      type: 'FILL_BLANK',
      content: {
        questionText: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }
    };
  } else if (q.questionType === 'PROGRAMMING') {
    return {
      ...base,
      type: 'PROGRAMMING',
      marks: 5,
      content: {
        title: q.question || q.problemStatement?.substring(0, 60) || 'Untitled',
        problemStatement: q.problemStatement || q.question,
        inputFormat: q.inputFormat || '',
        outputFormat: q.outputFormat || '',
        constraints: q.constraints || '',
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        hiddenTestCases: (q.hiddenTestCases || []).map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        })),
        starterCode: ''
      }
    };
  }

  return base;
}
