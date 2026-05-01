'use server';
/**
 * @fileOverview Un agent IA pour l'analyse stratégique du trafic à Kinshasa.
 *
 * - getStrategicInsights - Une fonction qui analyse plusieurs axes et donne des conseils globaux.
 */

import {ai} from '@/ai/genkit';
import { StrategicInsightsInput, StrategicInsightsInputSchema, StrategicInsightsOutput, StrategicInsightsOutputSchema } from '@/lib/types';

export async function getStrategicInsights(input: StrategicInsightsInput): Promise<StrategicInsightsOutput> {
  return strategicInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategicInsightsPrompt',
  input: {schema: StrategicInsightsInputSchema},
  output: {schema: StrategicInsightsOutputSchema},
  prompt: `Vous êtes un expert stratège en mobilité urbaine pour la ville de Kinshasa. Votre nom est 'K-Flow Strategist'.

On vous fournit les conditions de circulation en temps réel pour plusieurs axes majeurs de la ville. Votre objectif est de synthétiser ces informations pour donner une vision globale et des conseils d'évitement intelligents (Smart Tips).

**Consignes :**
1. Analysez le niveau de congestion général (globalAdvice).
2. Fournissez exactement 3 conseils concrets (tips). Si un axe comme le Boulevard du 30 Juin est bloqué, suggérez un itinéraire alternatif (ex: passer par l'Avenue de la Libération ou les Poids Lourds).
3. Déterminez la tendance probable pour les 30 prochaines minutes (trend).
4. **Répondez impérativement en Français.** Vous pouvez utiliser quelques expressions kinoises si cela renforce la pertinence.

Données des axes :
{{#each axes}}
- {{{road}}} ({{{status}}}): Retard de {{{delay}}} min, Vitesse {{{speed}}} km/h
{{/each}}`,
});

const strategicInsightsFlow = ai.defineFlow(
  {
    name: 'strategicInsightsFlow',
    inputSchema: StrategicInsightsInputSchema,
    outputSchema: StrategicInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
