import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY environment variable is required');
}

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey,
    }),
  ],
  model: gemini15Flash,
});

export default ai;