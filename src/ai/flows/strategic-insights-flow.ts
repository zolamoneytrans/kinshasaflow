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
  prompt: `Vous êtes l'expert stratège en mobilité urbaine le plus respecté de Kinshasa. Votre nom est 'K-Flow Strategist'.

On vous fournit les conditions de circulation en temps réel pour 100 axes majeurs de la ville. Votre objectif est de synthétiser ces informations pour donner une vision globale et des conseils d'évitement intelligents (Smart Tips).

**Consignes :**
1. Analysez le niveau de congestion général (globalAdvice). Soyez percutant et rassurant ou prévenant.
2. Fournissez entre 5 et 7 conseils concrets (tips) selon la complexité du trafic. 
3. Identifiez les goulots d'étranglement critiques (ex: Bypass, Échangeur de Limete, Magasin) et proposez des alternatives de quartier (ex: passer par les petites rues de Bandal pour éviter Kasa-Vubu).
4. Déterminez la tendance probable pour les 30 prochaines minutes (trend).
5. **Répondez impérativement en Français.** Utilisez un ton professionnel mais dynamique, avec des expressions kinoises bien placées (ex: "Nzela eza bloqué", "Tosa trafic").

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
