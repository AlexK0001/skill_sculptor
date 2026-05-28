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

Suggest a highly specific, actionable, and detailed learning plan for today.
CRITICAL: The resources you provide MUST be high quality, real, and specialized. 
- For programming concepts, prefer links to StackOverflow, MDN Web Docs, official documentation (like React.dev, python.org), or specific high-quality tutorials. 
- DO NOT just link to a generic Wikipedia page, or the youtube homepage. Link to a SPECIFIC search query or a likely existing guide that is directly relevant to the user's learning goal and current skill level.
- The plan should be realistic to accomplish today based on the user's daily plans and mood.`,
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
