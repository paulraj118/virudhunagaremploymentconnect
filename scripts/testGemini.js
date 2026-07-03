import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFile = fs.readFileSync(join(__dirname, '..', '.env'), 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

async function testGemini() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const prompt = `You are an expert technical interviewer preparing standard placement interview questions for freshers and campus recruitment.

Domain: Python
Focus specifically on the topic: "".

Generate exactly:
- 8 MCQ questions (4 options each, one correct answer)
- 6 Fill in the Blank questions
- 6 Programming questions

RULES:
1. All questions must be standard interview level suitable for freshers.
2. Do NOT classify questions by difficulty (Easy/Medium/Hard).
3. Each question must be unique and not repeat.
4. MCQs must have exactly 4 options labeled A, B, C, D.
5. Programming questions must have input format, output format, constraints, sample I/O, and 5 hidden test cases.
6. Return STRICT JSON format ONLY. No markdown wrapping.

Return this exact JSON structure:
{
  "questions": [ ... ]
}`;

  console.log('Fetching...');
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

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
