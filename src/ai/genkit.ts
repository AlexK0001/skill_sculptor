import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { defineConfig } from 'genkit';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

export const ai = defineConfig({
   plugins: [googleAI({
    apiKey: process.env.GOOGLE_API_KEY,
  })],
  model: gemini15Flash, // Default model
  enableTracingAndMetrics: process.env.NODE_ENV === 'development',
});

export default ai;