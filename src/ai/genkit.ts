import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { defineConfig } from 'genkit';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY environment variable is required');
}

export const ai = defineConfig({
  plugins: [googleAI({ apiKey })],
  model: gemini15Flash,
  enableTracingAndMetrics: process.env.NODE_ENV === 'development',
});

export default ai;
