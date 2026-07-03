import mongoose from 'mongoose';
import Groq from 'groq-sdk';
import fs from 'fs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobfair_pro';
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

const SelfAssessmentQuestion = mongoose.models.SelfAssessmentQuestion || mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);

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

const SUB_PHASES = {
  '3A': ALL_DOMAINS.slice(20, 25), // 5 domains
  '3B': ALL_DOMAINS.slice(25, 30), // 5 domains
  '3C': ALL_DOMAINS.slice(30, 35), // 5 domains
  '3D': ALL_DOMAINS.slice(35, 37)  // 2 domains
};

const TARGET_PER_DIFFICULTY = 80;
const BATCH_SIZE = 20;
const RETRIES = 10;

// Global Stats Tracker
const globalStats = {
  generated: 0,
  inserted: 0,
  skipped: 0,
  duplicates: 0,
  retries: 0,
  failedBatches: 0,
  startTime: Date.now()
};

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
      response_format: { type: 'json_object' }
    });

    let text = response.choices[0].message.content;
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
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
    return { error: true, message: error.message };
  }
}

async function processDomain(domain, subPhaseName) {
  console.log(`\n======================================`);
  console.log(`Sub-Phase ${subPhaseName} | Domain: ${domain}`);
  console.log(`======================================`);

  const difficulties = [
    { level: 'low', name: 'Easy' },
    { level: 'medium', name: 'Medium' },
    { level: 'high', name: 'Hard' }
  ];

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

      console.log(`\n  [${diff.name}] Missing ${remaining} questions. Generating...`);
      const totalBatches = Math.ceil(remaining / BATCH_SIZE);
      let currentBatch = 1;

      while (remaining > 0) {
        const batchSize = Math.min(BATCH_SIZE, remaining);
        let success = false;
        let attempt = 0;
        
        while (!success && attempt < RETRIES) {
          attempt++;
          const result = await generateBatch(domain, diff.name, diff.level, batchSize);
          
          if (result && !result.error && Array.isArray(result)) {
            const questions = result;
            globalStats.generated += questions.length;
            
            const uniqueTexts = new Set();
            const validQuestions = [];
            let skippedInBatch = 0;
            let duplicatesInBatch = 0;
            
            for (const q of questions) {
              if (!q.questionText || !q.options || q.options.length !== 4 || typeof q.correctOptionIndex !== 'number') {
                skippedInBatch++;
                continue;
              }
              if (uniqueTexts.has(q.questionText)) {
                duplicatesInBatch++;
                skippedInBatch++;
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
                  duplicatesInBatch += (validQuestions.length - insertedInBatch);
                }
              }
            }
            
            globalStats.inserted += insertedInBatch;
            globalStats.skipped += skippedInBatch;
            globalStats.duplicates += duplicatesInBatch;
            remaining -= insertedInBatch;
            success = true;
            
            console.log(`    Sub-Phase: ${subPhaseName} | Domain: ${domain} | Diff: ${diff.name} | Batch: ${currentBatch}/${totalBatches} | Gen: ${questions.length} | Ins: ${insertedInBatch} | Skip: ${skippedInBatch} | Rem: ${Math.max(0, remaining)}`);
          } else {
            globalStats.retries++;
            const delayMs = Math.pow(2, attempt) * 2000;
            console.log(`    [Error] ${result?.message} - Retry ${attempt} in ${delayMs/1000}s...`);
            await new Promise(r => setTimeout(r, delayMs));
          }
        }

        if (!success) {
          globalStats.failedBatches++;
          console.log(`    ❌ Failed Batch after ${RETRIES} attempts. Restarting loop check...`);
          break; 
        }

        currentBatch++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

async function runNormalization(domainsToNormalize, phaseName) {
  console.log(`\n======================================================`);
  console.log(`STARTING NORMALIZATION FOR ${phaseName}...`);
  console.log(`======================================================`);

  const report = {};

  for (const domain of domainsToNormalize) {
    report[domain] = { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
    const levels = [
      { level: 'low', name: 'Easy' },
      { level: 'medium', name: 'Medium' },
      { level: 'high', name: 'Hard' }
    ];

    for (const diff of levels) {
      const docs = await SelfAssessmentQuestion.find({ domain, level: diff.level }).sort({ createdAt: 1 });
      
      const uniqueTexts = new Set();
      const toKeep = [];
      const toDelete = [];

      for (const doc of docs) {
        const isValid = doc.questionText && doc.options && doc.options.length === 4 && 
                        typeof doc.correctOptionIndex === 'number' && doc.explanation && doc.difficulty;
        const isDuplicate = uniqueTexts.has(doc.questionText);

        if (isValid && !isDuplicate) {
          uniqueTexts.add(doc.questionText);
          toKeep.push(doc);
        } else {
          toDelete.push(doc._id);
        }
      }

      if (toDelete.length > 0) {
        await SelfAssessmentQuestion.deleteMany({ _id: { $in: toDelete } });
      }

      if (toKeep.length > TARGET_PER_DIFFICULTY) {
        const excessIds = toKeep.slice(TARGET_PER_DIFFICULTY).map(d => d._id);
        await SelfAssessmentQuestion.deleteMany({ _id: { $in: excessIds } });
        toKeep.splice(TARGET_PER_DIFFICULTY);
      }

      let currentCount = toKeep.length;
      if (currentCount < TARGET_PER_DIFFICULTY) {
        let missingCount = TARGET_PER_DIFFICULTY - currentCount;
        while (missingCount > 0) {
          const generated = await generateBatch(domain, diff.name, diff.level, missingCount);
          if (generated && !generated.error && Array.isArray(generated)) {
            const valid = generated.filter(q => q.questionText && q.options && q.options.length === 4);
            const mapped = valid.map(q => ({
               domain, level: diff.level, topic: q.topic || domain, questionText: q.questionText,
               options: q.options, correctOptionIndex: q.correctOptionIndex, explanation: q.explanation || "None", difficulty: diff.name
            }));
            try {
              const insertRes = await SelfAssessmentQuestion.insertMany(mapped, { ordered: false });
              missingCount -= insertRes.length;
              currentCount += insertRes.length;
              globalStats.generated += generated.length;
              globalStats.inserted += insertRes.length;
            } catch (err) {
              if (err.insertedDocs) {
                missingCount -= err.insertedDocs.length;
                currentCount += err.insertedDocs.length;
                globalStats.generated += generated.length;
                globalStats.inserted += err.insertedDocs.length;
              }
            }
          } else {
             await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      report[domain][diff.name] = currentCount;
      report[domain].Total += currentCount;
    }
  }

  console.log(`\n======================================================`);
  console.log(`${phaseName} VERIFICATION REPORT`);
  console.log(`======================================================`);
  console.log('Domain | Easy | Medium | Hard | Total');
  console.log('------------------------------------------------------');
  
  for (const domain of domainsToNormalize) {
    const r = report[domain];
    console.log(`${domain} | ${r.Easy} | ${r.Medium} | ${r.Hard} | ${r.Total}`);
  }
  console.log('======================================================\n');
}

async function removeGlobalDuplicates() {
  console.log('\n======================================================');
  console.log('RUNNING GLOBAL DUPLICATE CHECK ACROSS ENTIRE DATABASE');
  console.log('======================================================');
  
  const allDocs = await SelfAssessmentQuestion.find({}).sort({ createdAt: 1 });
  const uniqueTexts = new Set();
  const toDelete = [];
  
  for (const doc of allDocs) {
    if (uniqueTexts.has(doc.questionText)) {
      toDelete.push(doc._id);
    } else {
      uniqueTexts.add(doc.questionText);
    }
  }
  
  if (toDelete.length > 0) {
    await SelfAssessmentQuestion.deleteMany({ _id: { $in: toDelete } });
    console.log(`Removed ${toDelete.length} duplicates across entire database.`);
    
    // Rerun normalization to fill any gaps caused by global duplicate deletion
    console.log(`Re-normalizing ALL domains to ensure exactly 240 questions...`);
    await runNormalization(ALL_DOMAINS, 'FINAL RE-NORMALIZATION');
  } else {
    console.log(`No cross-domain duplicates found. Perfect!`);
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🚀 Connected to MongoDB\n');
    console.log(`Starting Phase 3 (17 Domains) via GROQ API\n`);

    for (const [subPhaseName, domains] of Object.entries(SUB_PHASES)) {
      console.log(`\n\n=== STARTING SUB-PHASE ${subPhaseName} ===`);
      for (const domain of domains) {
        await processDomain(domain, subPhaseName);
      }
      
      // Normalize after sub-phase
      await runNormalization(domains, `SUB-PHASE ${subPhaseName}`);
    }
    
    // Final Normalization across ALL 37 domains
    await runNormalization(ALL_DOMAINS, 'ALL 37 DOMAINS');
    await removeGlobalDuplicates();
    
    const execTime = formatTime(Date.now() - globalStats.startTime);
    
    console.log('\n======================================================');
    console.log('FINAL MASTER REPORT');
    console.log('======================================================');
    console.log(`Total Domains: 37`);
    console.log(`Total Target Questions: 8,880`);
    console.log(`Total Generated in this run: ${globalStats.generated}`);
    console.log(`Total Inserted in this run:  ${globalStats.inserted}`);
    console.log(`Total Skipped:               ${globalStats.skipped}`);
    console.log(`Duplicate Count:             ${globalStats.duplicates}`);
    console.log(`Failed Batches:              ${globalStats.failedBatches}`);
    
    let totalQuestionsNow = await SelfAssessmentQuestion.countDocuments();
    let successRate = ((globalStats.inserted / globalStats.generated) * 100).toFixed(2);
    if (isNaN(successRate)) successRate = '100.00';
    
    console.log(`Success Rate:                ${successRate}%`);
    console.log(`Execution Time:              ${execTime}`);
    console.log(`Actual Questions in DB:      ${totalQuestionsNow} / 8,880`);
    console.log('======================================================\n');
    
    console.log('🎉 PHASE 3 FULLY COMPLETED AND DATABASE VALIDATED!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
