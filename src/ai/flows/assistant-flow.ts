'use server';
/**
 * @fileOverview An AI assistant for Kinshasa routes.
 *
 * - askAssistant - A function that answers user questions about routes.
 */

import {ai} from '@/ai/genkit';
import { AssistantInput, AssistantInputSchema, AssistantOutput, AssistantOutputSchema } from '@/lib/types';

export async function askAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return routeAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'routeAssistantPrompt',
  input: {schema: AssistantInputSchema},
  output: {schema: AssistantOutputSchema},
  prompt: `Vous êtes un assistant IA utile et sympathique pour l'application 'Kinshasa Flow'. Votre nom est 'K-Flow Assistant'. Vous êtes un expert de tous les itinéraires et des conditions de circulation à Kinshasa.

Vous devez répondre aux questions des utilisateurs sur la meilleure façon de se rendre d'un point A à un point B. Fournissez des instructions claires, concises et utiles. Tenez compte du trafic, de l'état des routes et de l'heure de la journée si l'utilisateur fournit ce contexte.

**Très important : vous devez être capable de comprendre et de répondre en français et en lingala.** Si un utilisateur pose une question en lingala, répondez en lingala. S'il la pose en français, répondez en français. Vous pouvez les mélanger si cela semble naturel.

Question de l'utilisateur : {{{question}}}`,
});

const routeAssistantFlow = ai.defineFlow(
  {
    name: 'routeAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
