'use server';

/**
 * @fileOverview An AI agent that suggests a full, multi-day learning plan.
 *
 * - suggestFullLearningPlan - A function that suggests a personalized learning plan for the entire duration.
 * - SuggestFullLearningPlanInput - The input type for the suggestFullLearningPlan function.
 * - SuggestFullLearningPlanOutput - The return type for the suggestFullLearningPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFullLearningPlanInputSchema = z.object({
  name: z.string().describe("The user's name or nickname."),
  gender: z.string().describe("The user's gender."),
  age: z.number().describe('The user age.'),
  preferences: z.string().describe('The user preferences.'),
  strengths: z.string().describe('The user strengths.'),
  weaknesses: z.string().describe('The user weaknesses.'),
  learningGoal: z.string().describe('What the user wants to learn.'),
  learningDuration: z.number().describe('The total number of days the user wants to learn for.'),
});
export type SuggestFullLearningPlanInput = z.infer<typeof SuggestFullLearningPlanInputSchema>;

const DayPlanSchema = z.object({
    day: z.number().describe("The day number in the plan."),
    title: z.string().describe("The title for the day's plan."),
    tasks: z.array(z.string()).describe("A list of tasks for the day.")
});

const SuggestFullLearningPlanOutputSchema = z.object({
  fullPlan: z.array(DayPlanSchema).describe('A comprehensive, day-by-day learning plan for the entire duration.'),
});
export type SuggestFullLearningPlanOutput = z.infer<typeof SuggestFullLearningPlanOutputSchema>;

export async function suggestFullLearningPlan(input: SuggestFullLearningPlanInput): Promise<SuggestFullLearningPlanOutput> {
  return suggestFullLearningPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFullLearningPlanPrompt',
  input: {schema: SuggestFullLearningPlanInputSchema},
  output: {schema: SuggestFullLearningPlanOutputSchema},
  prompt: `You are a personalized learning plan assistant. Based on the user's information and learning goal, create a comprehensive, day-by-day learning plan for the entire specified duration.

User's Name: {{{name}}}
User's Gender: {{{gender}}}
User's Age: {{{age}}}
User's Preferences: {{{preferences}}}
User's Strengths: {{{strengths}}}
User's Weaknesses: {{{weaknesses}}}
Learning Goal: {{{learningGoal}}}
Total Learning Duration: {{{learningDuration}}} days

Create a detailed, step-by-step learning plan for the entire period. Structure the output as an array of daily plans, where each day has a title and a list of specific tasks.`,
});

const suggestFullLearningPlanFlow = ai.defineFlow(
  {
    name: 'suggestFullLearningPlanFlow',
    inputSchema: SuggestFullLearningPlanInputSchema,
    outputSchema: SuggestFullLearningPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
