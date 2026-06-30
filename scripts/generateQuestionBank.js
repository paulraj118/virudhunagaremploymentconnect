import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import path from 'path';

// Load environment variables (Next.js way)
const projectDir = process.cwd();
loadEnvConfig(projectDir);


import SelfAssessmentQuestion from '../src/models/SelfAssessmentQuestion.js';

// Configuration
const DOMAINS = [
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
  'Pharmacovigilance', 'Public Health', 'Others - Arts & Science', 
  'Others - Engineering', 'Others - Management'
];

const TARGETS = {
  low: { count: 100, difficulty: 'Easy' },
  medium: { count: 70, difficulty: 'Medium' },
  high: { count: 70, difficulty: 'Hard' }
};

const BATCH_SIZE = 20;
const MAX_RETRIES = 5;

// Global Stats
let stats = {
  domainsCompleted: 0,
  totalDomains: DOMAINS.length,
  questionsGenerated: 0,
  questionsSkipped: 0, // due to existing count
  duplicateCount: 0,
  failedAttempts: 0,
  retryCount: 0,
  totalStored: 0
};

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function generateBatchWithRetry(ai, domain, level, difficulty, neededCount) {
  const requestCount = Math.min(BATCH_SIZE, neededCount);
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const prompt = `Generate exactly ${requestCount} multiple choice questions for the domain: "${domain}".
Level: ${level} (${difficulty} difficulty).
These MUST be highly relevant to industry standards, interview-oriented, and technically accurate.
NO duplicate concepts. NO ambiguous answers. Exactly 4 options, exactly 1 correct answer.
Return ONLY a raw JSON array of objects. Format:
[{
  "questionText": "...",
  "options": ["A", "B", "C", "D"],
  "correctOptionIndex": 0,
  "explanation": "...",
  "topic": "..."
}]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      if (!Array.isArray(data)) throw new Error("API did not return a JSON array");
      return data;

    } catch (error) {
      attempt++;
      stats.failedAttempts++;
      stats.retryCount++;
      console.warn(`    ⚠️ Batch generation failed (Attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
    }
  }
  return [];
}

async function processDomainLevel(ai, domain, level, difficulty, targetCount) {
  let existingCount = 0;
  
  // Retry on transient MongoDB failures
  for (let i = 0; i < 3; i++) {
    try {
      existingCount = await SelfAssessmentQuestion.countDocuments({ domain, level });
      break;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (existingCount >= targetCount) {
    stats.questionsSkipped += targetCount;
    return existingCount;
  }

  let currentCount = existingCount;
  
  while (currentCount < targetCount) {
    const needed = targetCount - currentCount;
    const questions = await generateBatchWithRetry(ai, domain, level, difficulty, needed);

    if (questions.length === 0) {
      console.error(`    ❌ Failed to generate questions for ${domain} (${level}) after max retries.`);
      break; // Move on, try not to get permanently stuck
    }

    stats.questionsGenerated += questions.length;
    let savedInBatch = 0;

    for (const q of questions) {
      if (!q.questionText || !q.options || q.options.length !== 4 || q.correctOptionIndex === undefined) {
        continue;
      }

      // Check duplicate
      const isDuplicate = await SelfAssessmentQuestion.exists({
        domain,
        level,
        questionText: q.questionText
      });

      if (isDuplicate) {
        stats.duplicateCount++;
        continue;
      }

      try {
        await SelfAssessmentQuestion.create({
          domain,
          level,
          topic: q.topic || 'General',
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || 'No explanation provided.',
          difficulty
        });
        savedInBatch++;
        stats.totalStored++;
      } catch (dbErr) {
        // Handle transient MongoDB save errors
        console.warn(`    ⚠️ DB Save error: ${dbErr.message}`);
      }
    }
    
    currentCount += savedInBatch;
    
    // Progress Logging
    console.log(`    -> [${level.toUpperCase()}] Progress: ${currentCount} / ${targetCount} (Saved in batch: ${savedInBatch})`);
    
    // Respect rate limits between batches
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return currentCount;
}

async function main() {
  const startTime = Date.now();
  console.log('\n======================================================');
  console.log('🚀 PHASE 2: GENERATING COMPLETE QUESTION BANK');
  console.log('======================================================\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: Environment variable GEMINI_API_KEY is missing.');
    console.log('Please verify that .env is loaded correctly and contains GEMINI_API_KEY=your_api_key');
    process.exit(1);
  }

  await connectDB();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  for (const domain of DOMAINS) {
    console.log(`\nProcessing Domain: [${domain}]`);
    
    const lowCount = await processDomainLevel(ai, domain, 'low', TARGETS.low.difficulty, TARGETS.low.count);
    const mediumCount = await processDomainLevel(ai, domain, 'medium', TARGETS.medium.difficulty, TARGETS.medium.count);
    const highCount = await processDomainLevel(ai, domain, 'high', TARGETS.high.difficulty, TARGETS.high.count);

    const totalDomainCount = lowCount + mediumCount + highCount;
    
    console.log(`\n📊 Status for ${domain}:`);
    console.log(`  Low:    ${lowCount} / 100`);
    console.log(`  Medium: ${mediumCount} / 70`);
    console.log(`  High:   ${highCount} / 70`);
    console.log(`  Overall: ${totalDomainCount} / 240`);

    if (totalDomainCount >= 240) {
      stats.domainsCompleted++;
    }
  }

  const endTime = Date.now();
  const executionTimeMs = endTime - startTime;
  const executionTimeMins = (executionTimeMs / 60000).toFixed(2);
  const totalInDB = await SelfAssessmentQuestion.countDocuments();

  console.log('\n======================================================');
  console.log('✅ COMPLETION REPORT');
  console.log('======================================================');
  console.log(`Domains Completed: ${stats.domainsCompleted}`);
  console.log(`Total Domains: ${stats.totalDomains}`);
  console.log(`Questions Generated: ${stats.questionsGenerated}`);
  console.log(`Questions Skipped (Already existed): ${stats.questionsSkipped}`);
  console.log(`Duplicate Count: ${stats.duplicateCount}`);
  console.log(`Failed Attempts: ${stats.failedAttempts}`);
  console.log(`Retry Count: ${stats.retryCount}`);
  console.log(`Total Questions Stored: ${stats.totalStored}`);
  console.log(`Total Questions Currently in MongoDB: ${totalInDB}`);
  console.log(`Total Execution Time: ${executionTimeMins} minutes`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
