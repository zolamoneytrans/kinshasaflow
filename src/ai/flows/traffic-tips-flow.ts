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
  prompt: `Vous êtes un expert de la circulation à Kinshasa. Votre objectif est de fournir des conseils utiles et exploitables aux conducteurs pour naviguer et éviter le trafic en fonction des rapports en temps réel.

On vous signale l'incident de circulation suivant :
Lieu: {{{location}}}
Description: {{{description}}}

Sur la base de ces informations, fournissez une liste de 2 à 3 conseils clairs et concis pour les conducteurs à Kinshasa. Les conseils doivent être spécifiques à l'emplacement si possible et offrir des itinéraires alternatifs pratiques ou des conseils. Par exemple, suggérez des routes spécifiques à emprunter à la place, ou conseillez d'attendre s'il s'agit d'un problème temporaire. Supposez que l'utilisateur est familier avec les principaux points de repère et routes de Kinshasa.

Générez une liste de conseils.`,
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
