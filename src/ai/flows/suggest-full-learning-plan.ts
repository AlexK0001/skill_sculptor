'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestFullPlanInputSchema = z.object({
  topic: z.string().describe("The name of the skill or topic the user wants to learn."),
  level: z.string().describe("The user's current skill level."),
  durationMonths: z.number().describe("The desired duration of the learning plan in months (3 to 12)."),
});

export type SuggestFullPlanInput = z.infer<typeof SuggestFullPlanInputSchema>;

const PlanItemSchema = z.object({
  title: z.string().describe("Title of the task or concept to learn."),
  link: z.string().url().describe("A high-quality real URL pointing to specific documentation, tutorials, or public resources (e.g. StackOverflow, React.dev, YouTube, MDN)."),
});

const PlanPhaseSchema = z.object({
  phase: z.string().describe("The name of the phase (e.g. Phase 1: Basics)."),
  items: z.array(PlanItemSchema).describe("List of specific tasks/items to study in this phase."),
});

const SuggestFullPlanOutputSchema = z.object({
  plan: z.array(PlanPhaseSchema).describe("The complete learning plan composed of several phases."),
});

export type SuggestFullPlanOutput = z.infer<typeof SuggestFullPlanOutputSchema>;

const prompt = ai.definePrompt({
  name: 'suggestFullPlanPrompt',
  input: { schema: SuggestFullPlanInputSchema },
  output: { schema: SuggestFullPlanOutputSchema },
  prompt: `You are an expert curriculum designer. A user wants to learn "{{{topic}}}" from their current level "{{{level}}}" over a period of {{{durationMonths}}} months.
Create a comprehensive, structured global learning plan.

IMPORTANT constraints:
1. "Рівномірно розподілений по дням": The plan MUST be distributed effectively across the duration. Divide the plan into Weekly Phases (e.g., "Week 1: Foundations", "Week 2: Next Steps", ... "Week X"). For a {{{durationMonths}}} month plan, generate roughly {{{durationMonths}}} * 4 = Total Weeks.
2. Inside each week, provide 3 to 7 specific daily "items" (tasks or concepts) that fill the length of the week.
3. The 'link' field MUST be a highly specific, real-world high-quality link relevant to the item. DO NOT output generic links like https://youtube.com or https://wikipedia.org.`,
});

export const suggestFullLearningPlan = ai.defineFlow(
  {
    name: 'suggestFullLearningPlanFlow',
    inputSchema: SuggestFullPlanInputSchema,
    outputSchema: SuggestFullPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);