import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobfair_pro';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SelfAssessmentQuestionSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, index: true },
    level: { type: String, enum: ['low', 'medium', 'high'], required: true, index: true },
    topic: { type: String, required: true },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  },
  { timestamps: true }
);

SelfAssessmentQuestionSchema.index({ domain: 1, level: 1, questionText: 1 }, { unique: true });

const SelfAssessmentQuestion = mongoose.models.SelfAssessmentQuestion ||
  mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);

// The 37 master domains
const ALL_DOMAINS = [
  'English Literature', 'Tamil Literature', 'History', 'Economics', 'Psychology',
  'Sociology', 'Journalism & Mass Communication', 'Visual Communication', 'Fine Arts',
  'Data Science', 'Artificial Intelligence & Machine Learning', 'Cyber Security',
  'Cloud Computing', 'Full Stack Development', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering',
  'Electronics & Communication Engineering (ECE)', 'Automobile Engineering',
  'Human Resources (HR)', 'Marketing', 'Finance', 'Operations Management',
  'Business Analytics', 'Supply Chain Management', 'Banking', 'Accounting',
  'Entrepreneurship', 'Pharmacy', 'Clinical Research', 'Nursing', 'Physiotherapy',
  'Medical Laboratory Technology', 'Healthcare Management', 'Biotechnology',
  'Pharmacovigilance', 'Public Health'
];

// Phase 1: First 10 domains
const DOMAINS_TO_SEED = ALL_DOMAINS.slice(0, 10);
const TARGET_PER_DIFFICULTY = 80;
const BATCH_SIZE = 40;
const RETRIES = 5;

// Metrics
let totalGenerated = 0;
let totalInserted = 0;
let totalSkipped = 0;
let totalDuplicates = 0;
let failedBatches = 0;
const startTime = Date.now();

const formatTime = (ms) => {
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
};

async function generateBatch(domain, difficulty, level, count) {
  const prompt = `
    Generate exactly ${count} multiple-choice questions for the domain "${domain}".
    Difficulty Level: ${difficulty} (System Level: ${level}).
    
    Generation Rules:
    - Use interview-oriented, beginner-friendly language.
    - No aptitude questions.
    - No programming questions UNLESS the domain itself is a programming domain.
    - Each question must have exactly 4 options.
    - Specify the 0-indexed correctOptionIndex (0, 1, 2, or 3).
    - Provide a short explanation.
    - Return a valid JSON array of objects. DO NOT use markdown code blocks like \`\`\`json.
    - Ensure output is ONLY raw JSON.

    Format required:
    [
      {
        "topic": "Specific sub-topic related to ${domain}",
        "questionText": "The question itself?",
        "options": ["A", "B", "C", "D"],
        "correctOptionIndex": 0,
        "explanation": "Short explanation here."
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    let text = response.text;
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Response is not an array");
    return parsed;
  } catch (error) {
    console.error(`\n    ❌ Batch Generation Error: ${error.message}`);
    return null;
  }
}

async function processDomain(domain) {
  console.log(`\n======================================`);
  console.log(`Domain: ${domain}`);
  console.log(`======================================`);

  const difficulties = [
    { level: 'low', name: 'Easy' },
    { level: 'medium', name: 'Medium' },
    { level: 'high', name: 'Hard' }
  ];

  for (const diff of difficulties) {
    // Check how many exist
    const existingCount = await SelfAssessmentQuestion.countDocuments({ domain, level: diff.level });
    let remaining = TARGET_PER_DIFFICULTY - existingCount;
    
    if (remaining <= 0) {
      console.log(`${diff.name}: Already completed (${existingCount} questions) ✔`);
      continue;
    }

    const totalBatches = Math.ceil(remaining / BATCH_SIZE);
    let currentBatch = 1;

    while (remaining > 0) {
      const batchSize = Math.min(BATCH_SIZE, remaining);
      let success = false;
      let attempt = 0;
      
      process.stdout.write(`  ${diff.name} - Batch ${currentBatch}/${totalBatches} `);

      while (!success && attempt < RETRIES) {
        attempt++;
        const questions = await generateBatch(domain, diff.name, diff.level, batchSize);
        
        if (questions && questions.length > 0) {
          totalGenerated += questions.length;
          
          // Internal Deduplication within batch
          const uniqueTexts = new Set();
          const validQuestions = [];
          
          for (const q of questions) {
            if (!q.questionText || !q.options || q.options.length !== 4 || typeof q.correctOptionIndex !== 'number') {
              totalSkipped++;
              continue;
            }
            if (uniqueTexts.has(q.questionText)) {
              totalDuplicates++;
              totalSkipped++;
              continue;
            }
            uniqueTexts.add(q.questionText);
            
            // Format document
            validQuestions.push({
              domain,
              level: diff.level,
              topic: q.topic || domain,
              questionText: q.questionText,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              explanation: q.explanation || "No explanation provided.",
              difficulty: diff.name
            });
          }

          // DB Deduplication and Insertion
          let insertedInBatch = 0;
          for (const doc of validQuestions) {
            try {
              await SelfAssessmentQuestion.create(doc);
              insertedInBatch++;
              totalInserted++;
            } catch (err) {
              if (err.code === 11000) {
                totalDuplicates++;
                totalSkipped++;
              } else {
                totalSkipped++;
                fs.appendFileSync('skipped_questions.log', JSON.stringify({ error: err.message, doc }) + '\n');
              }
            }
          }
          
          remaining -= insertedInBatch;
          success = true;
          console.log(`✔ (Inserted: ${insertedInBatch}, Skipped: ${validQuestions.length - insertedInBatch})`);
        } else {
          console.log(`[Retry ${attempt}] Waiting 65s due to Rate Limit...`);
          await new Promise(r => setTimeout(r, 65000));
        }
      }

      if (!success) {
        console.log(`❌ Failed Batch after ${RETRIES} attempts.`);
        failedBatches++;
        remaining -= batchSize; // Skip this batch count to prevent infinite loop
      }

      currentBatch++;
      await new Promise(r => setTimeout(r, 15000)); // Delay between batches
    }
    console.log(`  Completed ${diff.name} ✔`);
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('Starting Phase 1 (First 10 Domains)...\n');

    for (const domain of DOMAINS_TO_SEED) {
      await processDomain(domain);
    }

    const elapsed = Date.now() - startTime;
    const successRate = totalGenerated > 0 ? ((totalInserted / totalGenerated) * 100).toFixed(2) : 0;

    console.log(`\n======================================`);
    console.log(`📈 PHASE 1 COMPLETION REPORT`);
    console.log(`======================================`);
    console.log(`- Domains Completed: ${DOMAINS_TO_SEED.length}`);
    console.log(`- Questions Generated: ${totalGenerated}`);
    console.log(`- Questions Inserted: ${totalInserted}`);
    console.log(`- Questions Skipped: ${totalSkipped}`);
    console.log(`- Duplicate Count: ${totalDuplicates}`);
    console.log(`- Failed Batches: ${failedBatches}`);
    console.log(`- Success Rate: ${successRate}%`);
    console.log(`- Total Execution Time: ${formatTime(elapsed)}`);
    console.log(`======================================\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

run();
