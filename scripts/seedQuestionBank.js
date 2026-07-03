/**
 * Seed Question Bank Script
 * 
 * Usage: node scripts/seedQuestionBank.js
 * 
 * This script generates ~200 questions per domain (23 domains) using Gemini AI
 * and saves them directly into MongoDB QuestionBank collection.
 * 
 * Features:
 * - Batch processing (20 questions per Gemini request)
 * - Exponential backoff on rate limits (HTTP 429)
 * - Duplicate detection before saving
 * - Resume support (checks existing count per domain before generating)
 * - Live progress output
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI || !GEMINI_API_KEY) {
  console.error('❌ Missing MONGODB_URI or GEMINI_API_KEY in .env');
  process.exit(1);
}

// Define QuestionBank schema inline (to avoid import issues)
const questionBankSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  jobRole: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'FILL_BLANK', 'PROGRAMMING'], required: true },
  tags: [{ type: String }],
  language: { type: String, default: null },
  content: {
    questionText: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    title: String,
    problemStatement: String,
    inputFormat: String,
    outputFormat: String,
    constraints: String,
    sampleInput: String,
    sampleOutput: String,
    hiddenTestCases: [{ input: String, expectedOutput: String }],
    starterCode: String,
    expectedSolution: String
  },
  marks: { type: Number, default: 1 },
  status: { type: String, enum: ['Pending Review', 'Approved', 'Archived'], default: 'Pending Review' },
  isAiGenerated: { type: Boolean, default: false },
  analytics: {
    timesUsed: { type: Number, default: 0 },
    lastUsedDate: { type: Date, default: null },
    averageScore: { type: Number, default: 0 },
    passPercentage: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  },
  quality: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    hrFeedback: [{ type: String }],
    candidateSuccessRate: { type: Number, default: 0 }
  },
  versionHistory: [{
    version: Number,
    previousContent: mongoose.Schema.Types.Mixed,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now }
  }],
  currentVersion: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  difficulty: { type: String, default: 'Standard' },
  domain: { type: String, default: '' },
  topic: { type: String, default: '' },
  source: { type: String, default: 'AI' },
  approved: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: null },
  attachments: [{ filename: String, fileUrl: String }]
}, { timestamps: true });

const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', questionBankSchema);

// All 23 domains
const DOMAINS = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB',
  'C', 'C++', 'HTML', 'CSS', 'Data Structures', 'Machine Learning',
  'Data Science', 'Power BI', 'R Programming', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'Cyber Security', 'Flutter', 'Android'
];

// Topics per domain
const DOMAIN_TOPICS = {
  'Python': ['Variables & Data Types', 'Operators', 'Strings', 'Lists', 'Tuples', 'Dictionaries', 'Sets', 'Functions', 'Loops', 'Conditional Statements', 'OOP Basics', 'Exception Handling', 'File Handling', 'Modules & Packages', 'List Comprehension', 'Lambda Functions'],
  'Java': ['Variables & Data Types', 'OOP Concepts', 'Loops', 'Arrays', 'Strings', 'Classes & Objects', 'Constructors', 'Inheritance', 'Polymorphism', 'Interfaces', 'Exception Handling', 'Collections Framework', 'Multithreading Basics'],
  'JavaScript': ['Variables & Scope', 'Data Types', 'Functions', 'Arrays', 'Objects', 'DOM Manipulation', 'Events', 'Promises', 'Async/Await', 'ES6 Features', 'Closures', 'Hoisting', 'Callbacks', 'Error Handling'],
  'React': ['Components', 'Props', 'State', 'Hooks (useState, useEffect)', 'Events', 'Forms', 'Routing', 'Context API', 'JSX', 'Lifecycle Methods', 'Conditional Rendering', 'Lists & Keys'],
  'Node.js': ['Modules', 'npm', 'File System', 'HTTP Server', 'Express.js', 'Middleware', 'REST API', 'Routing', 'Event Loop', 'Streams', 'Error Handling'],
  'SQL': ['SELECT Queries', 'WHERE Clause', 'JOINs', 'GROUP BY', 'ORDER BY', 'Aggregate Functions', 'Subqueries', 'INSERT/UPDATE/DELETE', 'Normalization', 'Keys (Primary, Foreign)', 'Indexes', 'Views'],
  'MongoDB': ['Documents & Collections', 'CRUD Operations', 'find() Queries', 'Aggregation Pipeline', 'Indexes', 'Schema Design', 'Mongoose', 'Operators', 'Projection', 'Embedded vs Referenced'],
  'C': ['Variables & Data Types', 'Operators', 'Control Flow', 'Loops', 'Arrays', 'Strings', 'Pointers', 'Functions', 'Structures', 'File I/O', 'Memory Management', 'Preprocessor Directives'],
  'C++': ['Variables & Data Types', 'OOP Concepts', 'Classes & Objects', 'Inheritance', 'Polymorphism', 'Templates', 'STL (Vectors, Maps)', 'Pointers & References', 'Exception Handling', 'Constructors & Destructors', 'Operator Overloading'],
  'HTML': ['Elements & Tags', 'Attributes', 'Forms & Input', 'Tables', 'Semantic HTML', 'Media Elements', 'Links & Navigation', 'Lists', 'HTML5 APIs', 'Accessibility', 'Meta Tags'],
  'CSS': ['Selectors', 'Box Model', 'Flexbox', 'Grid Layout', 'Positioning', 'Colors & Backgrounds', 'Typography', 'Responsive Design', 'Media Queries', 'Animations', 'Transitions', 'Pseudo-classes'],
  'Data Structures': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Binary Search Trees', 'Sorting Algorithms', 'Searching Algorithms', 'Hashing', 'Graphs', 'Recursion', 'Time & Space Complexity'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Regression', 'Classification', 'Clustering', 'Decision Trees', 'Random Forest', 'SVM', 'Neural Networks', 'Evaluation Metrics', 'Overfitting/Underfitting', 'Feature Engineering'],
  'Data Science': ['Data Cleaning', 'EDA', 'Pandas', 'NumPy', 'Data Visualization', 'Statistics', 'Probability', 'Correlation', 'Hypothesis Testing', 'Regression Analysis'],
  'Power BI': ['Dashboards', 'Reports', 'DAX Functions', 'Data Modeling', 'Visualizations', 'Filters & Slicers', 'Power Query', 'Data Sources', 'Relationships', 'Measures vs Calculated Columns'],
  'R Programming': ['Variables & Data Types', 'Vectors', 'Data Frames', 'Functions', 'Loops', 'ggplot2', 'Statistical Functions', 'Packages', 'Data Manipulation (dplyr)', 'String Operations'],
  'AWS': ['EC2', 'S3', 'IAM', 'Lambda', 'RDS', 'VPC', 'CloudWatch', 'DynamoDB', 'SNS/SQS', 'Elastic Beanstalk', 'Route 53'],
  'Azure': ['Virtual Machines', 'App Service', 'Blob Storage', 'Azure Functions', 'SQL Database', 'Active Directory', 'DevOps', 'Resource Groups', 'Networking', 'Key Vault'],
  'Docker': ['Containers vs VMs', 'Images', 'Dockerfile', 'Docker Compose', 'Volumes', 'Networking', 'Docker Hub', 'Commands', 'Layers & Caching', 'Multi-stage Builds'],
  'Kubernetes': ['Pods', 'Deployments', 'Services', 'Namespaces', 'ConfigMaps', 'Secrets', 'Ingress', 'kubectl', 'Scaling', 'Architecture', 'RBAC'],
  'Cyber Security': ['CIA Triad', 'Encryption (Symmetric/Asymmetric)', 'Firewalls', 'Malware Types', 'Authentication', 'Authorization', 'SQL Injection', 'XSS', 'HTTPS/SSL/TLS', 'Network Security', 'Social Engineering'],
  'Flutter': ['Widgets', 'State Management', 'Layouts', 'Navigation', 'Hot Reload', 'Dart Basics', 'Scaffold', 'ListView', 'Forms & Validation', 'Packages & Plugins'],
  'Android': ['Activities', 'Intents', 'Layouts (XML)', 'Views & ViewGroups', 'RecyclerView', 'Fragments', 'SharedPreferences', 'SQLite', 'Permissions', 'Activity Lifecycle']
};

const QUESTIONS_PER_DOMAIN = 200;
const BATCH_SIZE = 20;

function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPrompt(domain, topics, batchNum, totalBatches) {
  const mcqCount = 8;
  const fillCount = 6;
  const progCount = 6;

  // Rotate topics for variety
  const topicList = topics || DOMAIN_TOPICS[domain] || [domain];
  const startIdx = ((batchNum - 1) * 3) % topicList.length;
  const selectedTopics = [];
  for (let i = 0; i < Math.min(5, topicList.length); i++) {
    selectedTopics.push(topicList[(startIdx + i) % topicList.length]);
  }

  return `You are an expert technical interviewer. Generate standard placement interview questions for freshers/campus recruitment.

Domain: ${domain}
Focus Topics: ${selectedTopics.join(', ')}
Batch: ${batchNum} of ${totalBatches} (generate unique questions different from previous batches)

Generate exactly:
- ${mcqCount} MCQ questions (4 options each)
- ${fillCount} Fill in the Blank questions
- ${progCount} Programming questions

RULES:
1. Standard interview level for freshers. No difficulty classification.
2. Each question must be unique. Do NOT repeat questions.
3. MCQs must have exactly 4 options (A, B, C, D).
4. Programming questions must have: inputFormat, outputFormat, constraints, sampleInput, sampleOutput, and exactly 5 hiddenTestCases.
5. Return STRICT JSON only. No markdown.

JSON structure:
{
  "questions": [
    {
      "questionType": "MCQ",
      "question": "...",
      "options": ["A text", "B text", "C text", "D text"],
      "correctAnswer": "A",
      "explanation": "...",
      "topic": "specific topic"
    },
    {
      "questionType": "FILL_BLANK",
      "question": "The _____ keyword...",
      "correctAnswer": "def",
      "explanation": "...",
      "topic": "specific topic"
    },
    {
      "questionType": "PROGRAMMING",
      "question": "Problem Title",
      "problemStatement": "Description...",
      "inputFormat": "...",
      "outputFormat": "...",
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
      "explanation": "...",
      "topic": "specific topic"
    }
  ]
}`;
}

async function checkDuplicate(q, domain) {
  const baseQuery = { isDeleted: false, domain };

  if (q.questionType === 'MCQ' || q.questionType === 'FILL_BLANK') {
    const norm = normalizeText(q.question);
    if (!norm) return false;

    const type = q.questionType === 'MCQ' ? 'MCQ' : 'FILL_BLANK';
    const candidates = await QuestionBank.find({ ...baseQuery, type }).select('content.questionText').lean();

    for (const c of candidates) {
      if (normalizeText(c.content?.questionText) === norm) return true;
    }
  } else if (q.questionType === 'PROGRAMMING') {
    const title = q.question || '';
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

function mapToDoc(q, domain) {
  const base = {
    companyId: null,
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
    createdBy: null,
    marks: 1
  };

  if (q.questionType === 'MCQ') {
    return { ...base, type: 'MCQ', content: { questionText: q.question, options: q.options || [], correctAnswer: q.correctAnswer, explanation: q.explanation || '' } };
  } else if (q.questionType === 'FILL_BLANK') {
    return { ...base, type: 'FILL_BLANK', content: { questionText: q.question, correctAnswer: q.correctAnswer, explanation: q.explanation || '' } };
  } else if (q.questionType === 'PROGRAMMING') {
    return {
      ...base, type: 'PROGRAMMING', marks: 5,
      content: {
        title: q.question || 'Untitled',
        problemStatement: q.problemStatement || q.question,
        inputFormat: q.inputFormat || '',
        outputFormat: q.outputFormat || '',
        constraints: q.constraints || '',
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        hiddenTestCases: (q.hiddenTestCases || []).map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
        starterCode: ''
      }
    };
  }
  return base;
}

async function callGemini(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          })
        }
      );

      if (response.status === 429) {
        const delay = 5000 * Math.pow(2, attempt);
        console.log(`  ⏳ Rate limited (429). Waiting ${delay / 1000}s before retry ${attempt}/${retries}...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty AI response');

      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(text);
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = 3000 * Math.pow(2, attempt);
      console.log(`  ⚠️ Attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function seedDomain(domain) {
  const existingCount = await QuestionBank.countDocuments({ domain, isDeleted: false });
  const remaining = Math.max(0, QUESTIONS_PER_DOMAIN - existingCount);

  if (remaining === 0) {
    console.log(`✅ ${domain}: Already has ${existingCount} questions. Skipping.`);
    return { domain, generated: 0, saved: 0, duplicates: 0, failed: 0, skipped: true };
  }

  console.log(`\n📚 ${domain}: ${existingCount} existing, generating ${remaining} more...`);

  const batches = Math.ceil(remaining / BATCH_SIZE);
  let generated = 0, saved = 0, duplicates = 0, failed = 0;

  for (let batch = 1; batch <= batches; batch++) {
    const batchTarget = Math.min(BATCH_SIZE, remaining - generated);
    if (batchTarget <= 0) break;

    process.stdout.write(`  Batch ${batch}/${batches} (${generated}/${remaining})... `);

    try {
      const prompt = buildPrompt(domain, DOMAIN_TOPICS[domain], batch, batches);
      const result = await callGemini(prompt);
      const questions = result.questions || [];

      let batchSaved = 0, batchDups = 0;

      for (const q of questions) {
        try {
          const isDup = await checkDuplicate(q, domain);
          if (isDup) {
            batchDups++;
            duplicates++;
            continue;
          }
          const doc = mapToDoc(q, domain);
          await QuestionBank.create(doc);
          batchSaved++;
          saved++;
        } catch (saveErr) {
          failed++;
        }
      }

      generated += questions.length;
      console.log(`✅ Generated: ${questions.length}, Saved: ${batchSaved}, Dups: ${batchDups}`);

      // Delay between batches
      if (batch < batches) {
        await new Promise(res => setTimeout(res, 2000));
      }
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      failed += batchTarget;

      // Wait longer on failure
      if (batch < batches) {
        await new Promise(res => setTimeout(res, 5000));
      }
    }
  }

  console.log(`  📊 ${domain} Summary: Generated=${generated}, Saved=${saved}, Duplicates=${duplicates}, Failed=${failed}`);
  return { domain, generated, saved, duplicates, failed, skipped: false };
}

async function main() {
  console.log('🚀 Question Bank Seeder Starting...\n');
  console.log(`📌 Domains: ${DOMAINS.length}`);
  console.log(`📌 Target per domain: ${QUESTIONS_PER_DOMAIN}`);
  console.log(`📌 Batch size: ${BATCH_SIZE}`);
  console.log(`📌 Database: ${MONGODB_URI.substring(0, 30)}...`);
  console.log('');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  const results = [];
  const startTime = Date.now();

  for (const domain of DOMAINS) {
    const result = await seedDomain(domain);
    results.push(result);
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n═══════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════');

  let totalGenerated = 0, totalSaved = 0, totalDups = 0, totalFailed = 0;

  for (const r of results) {
    if (!r.skipped) {
      console.log(`  ${r.domain}: Generated=${r.generated}, Saved=${r.saved}, Dups=${r.duplicates}, Failed=${r.failed}`);
    } else {
      console.log(`  ${r.domain}: ⏭️ Skipped (already complete)`);
    }
    totalGenerated += r.generated;
    totalSaved += r.saved;
    totalDups += r.duplicates;
    totalFailed += r.failed;
  }

  console.log('');
  console.log(`  Total Generated: ${totalGenerated}`);
  console.log(`  Total Saved:     ${totalSaved}`);
  console.log(`  Total Duplicates: ${totalDups}`);
  console.log(`  Total Failed:    ${totalFailed}`);
  console.log(`  Time Taken:      ${totalTime} minutes`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('✅ Done. MongoDB disconnected.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
