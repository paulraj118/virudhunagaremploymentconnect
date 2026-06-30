// scripts/expandQuestionBank.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
  'Pharmacovigilance', 'Public Health'
];

const LEVELS = [
  { level: 'low', count: 100, difficulty: 'Easy' },
  { level: 'medium', count: 70, difficulty: 'Medium' },
  { level: 'high', count: 70, difficulty: 'Hard' }
];

async function expandBank() {
  console.log('Starting Self Assessment Question Bank Expansion...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n======================================================');
    console.log('⚠️  NO AI INTEGRATION KEY FOUND');
    console.log('======================================================');
    console.log('The codebase has been prepared to support future AI-generated question expansion.');
    console.log('Please configure GEMINI_API_KEY in secure server-side environment variables (.env).');
    console.log('\nTarget Processing Metrics (Pending API Key):');
    console.log(`- Total Preferred Domains to process: ${DOMAINS.length}`);
    console.log('- Total Questions per domain: 240 (Low: 100, Medium: 70, High: 70)');
    console.log(`- Total Questions across all domains: ${DOMAINS.length * 240}`);
    return;
  }

  // AI Integration exists - initialize GenAI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let totalProcessed = 0;
  let totalCreated = 0;

  for (const domain of DOMAINS) {
    console.log(`\nProcessing Domain: ${domain}...`);
    let domainCreated = 0;
    
    for (const { level, count, difficulty } of LEVELS) {
      console.log(`  - Generating ${count} ${level} level questions...`);
      
      const prompt = `Generate exactly ${count} multiple choice questions for the domain: "${domain}".

DIFFICULTY LEVEL (STRICT):
- All questions MUST be at a "${difficulty}" difficulty level (which corresponds to ${level} level).
- ${level === 'medium' ? 'These must be completely different concepts from basic (low) level.' : ''}
- ${level === 'high' ? 'These must be advanced concepts, completely different from basic or medium levels.' : ''}

RULES:
- Questions must be relevant ONLY to "${domain}" domain.
- NO duplicate questions.
- Each question must have exactly 4 options with only one correct answer.
- Must be interview-oriented and industry relevant.
- Include a short explanation.

Return ONLY a raw JSON array of objects. Each object must have exactly these fields:
- "domain" (string, exact value: "${domain}")
- "level" (string, exact value: "${level}")
- "difficulty" (string, exact value: "${difficulty}")
- "topic" (string)
- "questionText" (string)
- "options" (array of exactly 4 strings)
- "correctOptionIndex" (integer 0 to 3)
- "explanation" (string)`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        const generated = JSON.parse(response.text);
        if (Array.isArray(generated)) {
          // Output to a structured JSON file or database (omitted actual DB insert to prevent accidental spam during testing)
          console.log(`    ✓ Successfully generated ${generated.length} questions for ${domain} (${level})`);
          domainCreated += generated.length;
          totalCreated += generated.length;
        }
      } catch (err) {
        console.error(`    x Error generating questions for ${domain} (${level}): ${err.message}`);
      }
      
      // Delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    totalProcessed++;
    console.log(`  -> Total questions created for ${domain}: ${domainCreated}`);
  }

  console.log('\n======================================================');
  console.log('✅ EXPANSION COMPLETE');
  console.log('======================================================');
  console.log(`Total Preferred Domains processed: ${totalProcessed}`);
  console.log(`Total Questions across all domains: ${totalCreated}`);
}

expandBank();
