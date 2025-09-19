import { gemini15Flash, googleAI } from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY environment variable is required');
}

export const ai: any = {
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: gemini15Flash,
  // Шими — повертають свої аргументи / функції, щоб code, який чекає definePrompt/defineFlow, працював.
  definePrompt: (p: any) => p,
  defineFlow: (f: any) => f,
  defineChain: (c: any) => c,
  defineStep: (s: any) => s,
};

export default ai;
