'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLearningPlanInputSchema = z.object({
  name: z.string().describe("The user's name or nickname."),
  gender: z.string().describe("The user's gender."),
  age: z.number().describe('The user age.'),
  preferences: z.string().describe('The user preferences.'),
  strengths: z.string().describe('The user strengths.'),
  weaknesses: z.string().describe('The user weaknesses.'),
  learningGoal: z.string().describe('What the user wants to learn.'),
  mood: z.string().describe('The user current mood.'),
  dailyPlans: z.string().describe('The user plans for the day.'),
  level: z.string().optional().describe('The current skill level of the user.')
});
export type SuggestLearningPlanInput = z.infer<typeof SuggestLearningPlanInputSchema>;

const LearningTaskSchema = z.object({
  title: z.string().describe("The title of the task."),
  description: z.string().describe("Detailed description of the task."),
  link: z.string().url().describe("A helpful link or URL connected to this task (e.g. YouTube tutorial, MDN article, helpful blog post).")
});

const SuggestLearningPlanOutputSchema = z.object({
  learningPlan: z.array(LearningTaskSchema).describe('A list of suggested learning tasks for the day.'),
});
export type SuggestLearningPlanOutput = z.infer<typeof SuggestLearningPlanOutputSchema>;

const prompt = ai.definePrompt({
  name: 'suggestLearningPlanPrompt',
  input: {schema: SuggestLearningPlanInputSchema},
  output: {schema: SuggestLearningPlanOutputSchema},
  prompt: `You are a personalized learning plan assistant. Based on the user's information, their current skill level, mood, and daily plans, suggest a structured learning plan for the day to help them achieve their learning goal.

User's Name: {{{name}}}
User's Gender: {{{gender}}}
User's Age: {{{age}}}
User's Preferences: {{{preferences}}}
User's Strengths: {{{strengths}}}
User's Weaknesses: {{{weaknesses}}}
Learning Goal: {{{learningGoal}}}
Skill Level: {{{level}}}
Current Mood: {{{mood}}}
Daily Plans: {{{dailyPlans}}}

Suggest a detailed, step-by-step learning plan for the day that is tailored to the user's level (e.g. Beginner vs Expert needs different resources!) and current state. For each step, provide a valid URL 'link' to a real, helpful public resource (like a specific YouTube search url, Wikipedia, or offical documentation) that will help them learn.`,
});

export const suggestLearningPlan = ai.defineFlow(
  {
    name: 'suggestLearningPlanFlow',
    inputSchema: SuggestLearningPlanInputSchema,
    outputSchema: SuggestLearningPlanOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
