'use server';

/**
 * @fileOverview A learning plan suggestion AI agent.
 *
 * - suggestLearningPlan - A function that suggests a personalized daily learning plan.
 * - SuggestLearningPlanInput - The input type for the suggestLearningPlan function.
 * - SuggestLearningPlanOutput - The return type for the suggestLearningPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLearningPlanInputSchema = z.object({
  gender: z.string().describe("The user's gender."),
  age: z.number().describe('The user age.'),
  preferences: z.string().describe('The user preferences.'),
  strengths: z.string().describe('The user strengths.'),
  weaknesses: z.string().describe('The user weaknesses.'),
  learningGoal: z.string().describe('What the user wants to learn.'),
  mood: z.string().describe('The user current mood.'),
  dailyPlans: z.string().describe('The user plans for the day.'),
});
export type SuggestLearningPlanInput = z.infer<typeof SuggestLearningPlanInputSchema>;

const SuggestLearningPlanOutputSchema = z.object({
  learningPlan: z.string().describe('A suggested learning plan for the day.'),
});
export type SuggestLearningPlanOutput = z.infer<typeof SuggestLearningPlanOutputSchema>;

export async function suggestLearningPlan(input: SuggestLearningPlanInput): Promise<SuggestLearningPlanOutput> {
  return suggestLearningPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLearningPlanPrompt',
  input: {schema: SuggestLearningPlanInputSchema},
  output: {schema: SuggestLearningPlanOutputSchema},
  prompt: `You are a personalized learning plan assistant. Based on the user's information, mood, and daily plans, suggest a learning plan or activity for the day to help them achieve their learning goal.

User's Gender: {{{gender}}}
User's Age: {{{age}}}
User's Preferences: {{{preferences}}}
User's Strengths: {{{strengths}}}
User's Weaknesses: {{{weaknesses}}}
Learning Goal: {{{learningGoal}}}
Current Mood: {{{mood}}}
Daily Plans: {{{dailyPlans}}}

Suggest a detailed learning plan for the day that is tailored to the user's current state and long-term goals. Include specific activities and resources, if possible.`,
});

const suggestLearningPlanFlow = ai.defineFlow(
  {
    name: 'suggestLearningPlanFlow',
    inputSchema: SuggestLearningPlanInputSchema,
    outputSchema: SuggestLearningPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
