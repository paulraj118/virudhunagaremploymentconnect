import mongoose from 'mongoose';
import Groq from 'groq-sdk';

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

// If model exists, use it. Otherwise, compile it.
const SelfAssessmentQuestion = mongoose.models.SelfAssessmentQuestion || 
  mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);

const ALL_DOMAINS = [
  'English Literature', 'Tamil Literature', 'History', 'Economics', 'Psychology',
  'Sociology', 'Journalism & Mass Communication', 'Visual Communication', 'Fine Arts',
  'Data Science'
];

const TARGET_PER_LEVEL = 80;

async function generateMissing(domain, difficulty, level, count) {
  const prompt = `
    Generate exactly ${count} multiple-choice questions for the domain "${domain}".
    Difficulty Level: ${difficulty}.
    
    Generation Rules:
    - Use interview-oriented, beginner-friendly language.
    - Each question must have exactly 4 options.
    - Specify the 0-indexed correctOptionIndex (0, 1, 2, or 3).
    - Provide a short explanation.
    - Return a valid JSON array of objects. DO NOT use markdown code blocks.

    Format required:
    [
      {
        "topic": "Specific sub-topic",
        "questionText": "The question itself?",
        "options": ["A", "B", "C", "D"],
        "correctOptionIndex": 0,
        "explanation": "Short explanation here."
      }
    ]
  `;

  let attempt = 0;
  while (attempt < 5) {
    attempt++;
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
           throw new Error("Not an array");
        }
      }

      // Filter and Map
      const valid = [];
      for (const q of parsed) {
        if (q.questionText && q.options && q.options.length === 4 && typeof q.correctOptionIndex === 'number') {
           valid.push({
             domain,
             level,
             topic: q.topic || domain,
             questionText: q.questionText,
             options: q.options,
             correctOptionIndex: q.correctOptionIndex,
             explanation: q.explanation || "No explanation provided.",
             difficulty
           });
        }
      }
      return valid;
    } catch (e) {
      console.log(`      [Groq Error] Retrying missing generation...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return [];
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB. Starting Normalization...\n');

  const report = {};

  for (const domain of ALL_DOMAINS) {
    console.log(`Processing Domain: ${domain}`);
    report[domain] = { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
    
    const levels = [
      { level: 'low', name: 'Easy' },
      { level: 'medium', name: 'Medium' },
      { level: 'high', name: 'Hard' }
    ];

    for (const diff of levels) {
      // 1. Fetch all
      const docs = await SelfAssessmentQuestion.find({ domain, level: diff.level }).sort({ createdAt: 1 });
      
      const uniqueTexts = new Set();
      const toKeep = [];
      const toDelete = [];

      for (const doc of docs) {
        // Validation Checks
        const isValid = doc.questionText && 
                        doc.options && doc.options.length === 4 && 
                        typeof doc.correctOptionIndex === 'number' && 
                        doc.explanation && doc.difficulty;
        
        const isDuplicate = uniqueTexts.has(doc.questionText);

        if (isValid && !isDuplicate) {
          uniqueTexts.add(doc.questionText);
          toKeep.push(doc);
        } else {
          toDelete.push(doc._id);
        }
      }

      // 2. Delete Invalid / Duplicates
      if (toDelete.length > 0) {
        await SelfAssessmentQuestion.deleteMany({ _id: { $in: toDelete } });
        console.log(`  [${diff.name}] Removed ${toDelete.length} invalid/duplicate questions.`);
      }

      // 3. Trim Excess
      if (toKeep.length > TARGET_PER_LEVEL) {
        const excessCount = toKeep.length - TARGET_PER_LEVEL;
        const excessDocs = toKeep.slice(TARGET_PER_LEVEL); // keep first 80, remove rest
        const excessIds = excessDocs.map(d => d._id);
        
        await SelfAssessmentQuestion.deleteMany({ _id: { $in: excessIds } });
        console.log(`  [${diff.name}] Removed ${excessCount} excess questions.`);
        toKeep.splice(TARGET_PER_LEVEL); // truncate array to 80
      }

      // 4. Fill Missing
      let currentCount = toKeep.length;
      if (currentCount < TARGET_PER_LEVEL) {
        let missingCount = TARGET_PER_LEVEL - currentCount;
        console.log(`  [${diff.name}] Missing ${missingCount} questions. Generating...`);
        
        while (missingCount > 0) {
          const generated = await generateMissing(domain, diff.name, diff.level, missingCount);
          if (generated.length > 0) {
            try {
              const insertRes = await SelfAssessmentQuestion.insertMany(generated, { ordered: false });
              missingCount -= insertRes.length;
              currentCount += insertRes.length;
            } catch (err) {
              // Ignore duplicate keys during insert, missingCount will be re-evaluated next loop if needed, but we trust insertRes length
              if (err.insertedDocs) {
                missingCount -= err.insertedDocs.length;
                currentCount += err.insertedDocs.length;
              }
            }
          }
        }
        console.log(`  [${diff.name}] Missing filled. Total is now ${currentCount}.`);
      }

      report[domain][diff.name] = currentCount;
      report[domain].Total += currentCount;
    }
  }

  console.log('\n======================================================');
  console.log('FINAL DOMAIN-WISE REPORT');
  console.log('======================================================');
  console.log('Domain | Easy | Medium | Hard | Total');
  console.log('------------------------------------------------------');
  for (const domain of ALL_DOMAINS) {
    const r = report[domain];
    console.log(`${domain} | ${r.Easy} | ${r.Medium} | ${r.Hard} | ${r.Total}`);
  }
  console.log('======================================================\n');
  
  await mongoose.disconnect();
  process.exit(0);
}

run();
