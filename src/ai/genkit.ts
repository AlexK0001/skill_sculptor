import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { defineConfig } from 'genkit';

export const ai = defineConfig({
  plugins: [googleAI()],
  model: gemini15Flash, // Default model
  enableTracingAndMetrics: process.env.NODE_ENV === 'development',
});

export default ai;