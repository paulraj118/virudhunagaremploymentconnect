import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobfair_pro';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define Schema manually to avoid ES module import issues when running standalone
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

const DOMAINS_TO_SEED = ['Marketing']; // We can add more domains here later
const LEVELS = ['low', 'medium', 'high'];
const QUESTIONS_PER_LEVEL = 10;

async function generateQuestions(domain, level) {
  const prompt = `
    You are an expert examiner for the domain "${domain}".
    Create exactly ${QUESTIONS_PER_LEVEL} multiple-choice questions for the "${level}" difficulty level.
    The "low" level should cover basic foundational concepts. 
    The "medium" level should cover intermediate and applied concepts.
    The "high" level should cover advanced, strategic, and complex scenarios.

    Requirements for each question:
    1. Must have exactly 4 options.
    2. Must specify the correctOptionIndex (0-3).
    3. Must provide a brief explanation.
    4. Provide a relevant sub-topic for each question.
    5. Difficulty string should be "Easy" for low, "Medium" for medium, "Hard" for high.

    Return the response as a JSON array of objects. Do not include markdown code blocks like \`\`\`json. Just the raw array.
    Example format:
    [
      {
        "topic": "Digital Marketing Basics",
        "questionText": "What does SEO stand for?",
        "options": ["Search Engine Optimization", "Social Engagement Order", "Search Entity Operations", "Site Efficiency Optimization"],
        "correctOptionIndex": 0,
        "explanation": "SEO stands for Search Engine Optimization, which is the process of improving website visibility.",
        "difficulty": "Easy"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    let text = response.text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error generating questions for ${domain} - ${level}:`, error);
    return [];
  }
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const domain of DOMAINS_TO_SEED) {
      console.log(`\n🚀 Processing Domain: ${domain}`);
      
      for (const level of LEVELS) {
        console.log(`   Generating ${level} level questions...`);
        const questions = await generateQuestions(domain, level);
        
        if (questions && questions.length > 0) {
          const docs = questions.map(q => ({
            domain,
            level,
            topic: q.topic || domain,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
            difficulty: q.difficulty || (level === 'low' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard')
          }));

          // Simple duplicate avoidance: Just insert and ignore unique index errors if they happen, 
          // or just insertMany since the DB is empty.
          try {
            await SelfAssessmentQuestion.insertMany(docs, { ordered: false });
            console.log(`   ✅ Inserted ${docs.length} questions for ${level} level.`);
          } catch (e) {
            console.log(`   ⚠️ Insert completed with some duplicates ignored.`);
          }
        } else {
          console.log(`   ❌ Failed to generate questions for ${level} level.`);
        }
        
        // Wait a few seconds to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

seed();
