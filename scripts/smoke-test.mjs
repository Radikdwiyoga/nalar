import 'dotenv/config';
import { generateGeminiStream } from '../lib/ai/providers/gemini';
import { generateGroqStream } from '../lib/ai/providers/groq';

async function main() {
  console.log('--- Testing Gemini ---');
  if (!process.env.GEMINI_API_KEY) {
    console.log('Skipping Gemini: GEMINI_API_KEY is not set');
  } else {
    try {
      const result = await generateGeminiStream({
        messages: [{ role: 'user', content: 'Halo, apakah kamu aktif? Jawab dalam satu kata.' }],
      });
      const reader = result.stream.getReader();
      let output = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += value;
      }
      console.log('Gemini OK, response:', output.trim());
    } catch (err: any) {
      console.error('Gemini Error:', err.message);
    }
  }

  console.log('\n--- Testing Groq ---');
  if (!process.env.GROQ_API_KEY) {
    console.log('Skipping Groq: GROQ_API_KEY is not set');
  } else {
    try {
      const result = await generateGroqStream({
        messages: [{ role: 'user', content: 'Halo, apakah kamu aktif? Jawab dalam satu kata.' }],
      });
      const reader = result.stream.getReader();
      let output = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += value;
      }
      console.log('Groq OK, response:', output.trim());
    } catch (err: any) {
      console.error('Groq Error:', err.message);
    }
  }
}

main();
