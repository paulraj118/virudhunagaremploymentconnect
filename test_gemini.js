const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate 2 MCQ questions about English Literature in JSON array format: [{"questionText": "...", "options": ["A", "B", "C", "D"], "correctOptionIndex": 0, "topic": "...", "explanation": "..."}]',
      config: { responseMimeType: "application/json" }
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
