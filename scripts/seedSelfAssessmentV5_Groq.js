import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Groq from 'groq-sdk';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobfair_pro';

if (!process.env.GROQ_API_KEY) {
  console.error('❌ Missing GROQ_API_KEY in .env');
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const DOMAINS_TO_SEED = ALL_DOMAINS.slice(0, 10);
const TARGET_PER_DIFFICULTY = 80;
const BATCH_SIZE = 20;
const RETRIES = 10;

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
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      response_format: { type: 'json_object' } // We can't guarantee array directly with json_object sometimes, let's just let it return array and parse
    });

    let text = response.choices[0].message.content;
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // In case Llama3 wraps it in a json object like { "questions": [...] }
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      if (parsed.questions && Array.isArray(parsed.questions)) {
         parsed = parsed.questions;
      } else if (parsed.questionText) {
         parsed = [parsed];
      } else {
         throw new Error("Response is not an array");
      }
    }
    return parsed;
  } catch (error) {
    let waitMs = 0;
    const isRateLimit = error.status === 429;
    
    // If it's a Groq rate limit, they usually specify retry headers or it's a fast reset
    if (isRateLimit && error.headers && error.headers['retry-after']) {
      waitMs = parseFloat(error.headers['retry-after']) * 1000;
    }
    
    return { error: true, waitMs, message: error.message, isRateLimit };
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

  let domainGenerated = 0;
  let domainInserted = 0;
  let domainSkipped = 0;
  let domainDuplicates = 0;
  let domainRetries = 0;
  const domainStart = Date.now();

  for (const diff of difficulties) {
    let completedLevel = false;

    while (!completedLevel) {
      const existingCount = await SelfAssessmentQuestion.countDocuments({ domain, level: diff.level });
      let remaining = TARGET_PER_DIFFICULTY - existingCount;
      
      if (remaining <= 0) {
        console.log(`${diff.name}: Already completed (${existingCount} questions) ✔`);
        completedLevel = true;
        break;
      }

      console.log(`\n  ${diff.name} - Missing ${remaining} questions. Generating...`);
      const totalBatches = Math.ceil(remaining / BATCH_SIZE);
      let currentBatch = 1;

      while (remaining > 0) {
        const batchSize = Math.min(BATCH_SIZE, remaining);
        let success = false;
        let attempt = 0;
        
        process.stdout.write(`    Batch ${currentBatch}/${totalBatches} `);

        while (!success && attempt < RETRIES) {
          attempt++;
          const result = await generateBatch(domain, diff.name, diff.level, batchSize);
          
          if (result && !result.error && Array.isArray(result)) {
            const questions = result;
            domainGenerated += questions.length;
            
            const uniqueTexts = new Set();
            const validQuestions = [];
            
            for (const q of questions) {
              if (!q.questionText || !q.options || q.options.length !== 4 || typeof q.correctOptionIndex !== 'number') {
                domainSkipped++;
                continue;
              }
              if (uniqueTexts.has(q.questionText)) {
                domainDuplicates++;
                domainSkipped++;
                continue;
              }
              uniqueTexts.add(q.questionText);
              
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

            let insertedInBatch = 0;
            if (validQuestions.length > 0) {
              try {
                const insertRes = await SelfAssessmentQuestion.insertMany(validQuestions, { ordered: false });
                insertedInBatch = insertRes.length;
              } catch (err) {
                if (err.code === 11000 || (err.writeErrors && err.writeErrors.some(e => e.code === 11000))) {
                  insertedInBatch = err.insertedDocs ? err.insertedDocs.length : 0;
                  domainDuplicates += (validQuestions.length - insertedInBatch);
                } else {
                  console.log("DB Insert Error:", err.message);
                }
              }
            }
            
            domainInserted += insertedInBatch;
            remaining -= insertedInBatch;
            success = true;
            console.log(`✔ (Generated: ${questions.length}, Inserted: ${insertedInBatch})`);
          } else {
            // Standard Error Backoff (Rate Limit, Network issue, etc)
            domainRetries++;
            let delayMs = 5000;
            if (result && result.error && result.waitMs > 0) {
              delayMs = result.waitMs + 1000;
            } else {
              delayMs = Math.pow(2, attempt) * 2000 + Math.floor(Math.random() * 2000);
            }
            
            console.log(`\n      [Error] ${result.message} - Waiting ${Math.ceil(delayMs/1000)}s before Retry ${attempt}...`);
            await new Promise(r => setTimeout(r, delayMs));
            process.stdout.write(`    Batch ${currentBatch}/${totalBatches} [Retry ${attempt}] `);
          }
        }

        if (!success) {
          console.log(`\n      ❌ Failed Batch after ${RETRIES} attempts. Skipping...`);
          break; 
        }

        currentBatch++;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  const domainElapsed = Date.now() - domainStart;
  console.log(`\n--------------------------------------`);
  console.log(`✅ ${domain} COMPLETION REPORT`);
  console.log(`- Generated: ${domainGenerated}`);
  console.log(`- Inserted:  ${domainInserted}`);
  console.log(`- Skipped:   ${domainSkipped}`);
  console.log(`- Retries:   ${domainRetries}`);
  console.log(`- Duplicates:${domainDuplicates}`);
  console.log(`- Exec Time: ${formatTime(domainElapsed)}`);
  console.log(`--------------------------------------\n`);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log(`Starting Phase 1 via GROQ API (Llama3-70b)\n`);

    for (const domain of DOMAINS_TO_SEED) {
      await processDomain(domain);
    }
    
    console.log('\n🎉 PHASE 1 FULLY COMPLETED!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
