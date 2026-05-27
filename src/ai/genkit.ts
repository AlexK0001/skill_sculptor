import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || 'fake-key-for-now';

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey,
    }),
  ],
  model: gemini15Flash,
});
