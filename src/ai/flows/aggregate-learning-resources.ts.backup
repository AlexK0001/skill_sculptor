'use server';

/**
 * @fileOverview An AI agent that aggregates learning resources from open sources based on the user's current learning objective.
 *
 * - aggregateLearningResources - A function that handles the aggregation of learning resources.
 * - AggregateLearningResourcesInput - The input type for the aggregateLearningResources function.
 * - AggregateLearningResourcesOutput - The return type for the aggregateLearningResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AggregateLearningResourcesInputSchema = z.object({
  learningObjective: z
    .string()
    .describe('The current learning objective of the user.'),
});
export type AggregateLearningResourcesInput = z.infer<
  typeof AggregateLearningResourcesInputSchema
>;

const AggregateLearningResourcesOutputSchema = z.object({
  resources: z
    .array(z.string())
    .describe('A list of relevant learning resources (URLs).'),
});
export type AggregateLearningResourcesOutput = z.infer<
  typeof AggregateLearningResourcesOutputSchema
>;

export async function aggregateLearningResources(
  input: AggregateLearningResourcesInput
): Promise<AggregateLearningResourcesOutput> {
  return aggregateLearningResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aggregateLearningResourcesPrompt',
  input: {schema: AggregateLearningResourcesInputSchema},
  output: {schema: AggregateLearningResourcesOutputSchema},
  prompt: `You are an AI assistant designed to find relevant learning resources for users.

  Based on the user's current learning objective, search open sources for helpful materials and provide a list of URLs.

  Learning Objective: {{{learningObjective}}}
  Please provide a list of relevant learning resource URLs:
  `,
});

const aggregateLearningResourcesFlow = ai.defineFlow(
  {
    name: 'aggregateLearningResourcesFlow',
    inputSchema: AggregateLearningResourcesInputSchema,
    outputSchema: AggregateLearningResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
