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

const SelfAssessmentQuestion = mongoose.models.SelfAssessmentQuestion ||
  mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);

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

// Phase 2: Index 10 to 19
const PHASE_2_DOMAINS = ALL_DOMAINS.slice(10, 20);
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

async function processDomain(domain) {
  console.log(`\n======================================`);
  console.log(`Phase 2 Domain: ${domain}`);
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
            domainGenerated += questions.length;
            
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
            
            domainInserted += insertedInBatch;
            domainSkipped += skippedInBatch;
            domainDuplicates += duplicatesInBatch;
            remaining -= insertedInBatch;
            success = true;
            
            console.log(`    Domain: ${domain} | Diff: ${diff.name} | Batch: ${currentBatch}/${totalBatches} | Gen: ${questions.length} | Ins: ${insertedInBatch} | Skip: ${skippedInBatch} | Rem: ${Math.max(0, remaining)}`);
          } else {
            domainRetries++;
            const delayMs = Math.pow(2, attempt) * 2000;
            console.log(`    [Error] ${result?.message} - Retry ${attempt} in ${delayMs/1000}s...`);
            await new Promise(r => setTimeout(r, delayMs));
          }
        }

        if (!success) {
          console.log(`    ❌ Failed Batch after ${RETRIES} attempts. Restarting loop check...`);
          break; 
        }

        currentBatch++;
        await new Promise(r => setTimeout(r, 1000));
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

async function runNormalization() {
  console.log('\n======================================================');
  console.log('STARTING AUTOMATIC NORMALIZATION FOR PHASE 2...');
  console.log('======================================================');

  const report = {};

  for (const domain of PHASE_2_DOMAINS) {
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
            } catch (err) {
              if (err.insertedDocs) {
                missingCount -= err.insertedDocs.length;
                currentCount += err.insertedDocs.length;
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

  console.log('\n======================================================');
  console.log('FINAL PHASE 2 VERIFICATION REPORT');
  console.log('======================================================');
  console.log('Domain | Easy | Medium | Hard | Total');
  console.log('------------------------------------------------------');
  
  // Write markdown report
  let mdReport = `# Phase 2 Verification Report\n\n`;
  mdReport += `| Domain | Easy | Medium | Hard | Total |\n`;
  mdReport += `|---|---|---|---|---|\n`;

  for (const domain of PHASE_2_DOMAINS) {
    const r = report[domain];
    console.log(`${domain} | ${r.Easy} | ${r.Medium} | ${r.Hard} | ${r.Total}`);
    mdReport += `| ${domain} | ${r.Easy} | ${r.Medium} | ${r.Hard} | ${r.Total} |\n`;
  }
  console.log('======================================================\n');
  
  fs.writeFileSync('C:/Users/ADMIN/.gemini/antigravity-ide/brain/92396551-309e-481c-8c0b-fbae913053f4/phase2_verification_report.md', mdReport);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log(`Starting Phase 2 via GROQ API (Llama-3.1-8b-instant)\n`);

    for (const domain of PHASE_2_DOMAINS) {
      await processDomain(domain);
    }
    
    await runNormalization();
    
    console.log('\n🎉 PHASE 2 FULLY COMPLETED!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
