'use server';
/**
 * @fileOverview A flow to generate traffic avoidance tips for Kinshasa.
 *
 * - getTrafficTips - A function that generates tips based on a traffic report.
 */

import {ai} from '@/ai/genkit';
import { TrafficTipsInput, TrafficTipsInputSchema, TrafficTipsOutput, TrafficTipsOutputSchema } from '@/lib/types';

export async function getTrafficTips(input: TrafficTipsInput): Promise<TrafficTipsOutput> {
  return trafficTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trafficTipsPrompt',
  input: {schema: TrafficTipsInputSchema},
  output: {schema: TrafficTipsOutputSchema},
  prompt: `You are a Kinshasa traffic expert. Your goal is to provide helpful, actionable tips for drivers to navigate and avoid traffic based on real-time reports.

You are given the following traffic incident:
Location: {{{location}}}
Description: {{{description}}}

Based on this information, provide a list of 2-3 clear and concise tips for drivers in Kinshasa. The tips should be specific to the location if possible and offer practical alternative routes or advice. For example, suggest specific roads to take instead, or advise on waiting if it's a temporary issue. Assume the user is familiar with major landmarks and roads in Kinshasa.

Generate a list of tips.`,
});

const trafficTipsFlow = ai.defineFlow(
  {
    name: 'trafficTipsFlow',
    inputSchema: TrafficTipsInputSchema,
    outputSchema: TrafficTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
