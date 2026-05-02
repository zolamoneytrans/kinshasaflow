'use server';
/**
 * @fileOverview Un assistant IA connecté aux données réelles de Kinshasa.
 *
 * - askAssistant - Une fonction qui répond aux questions des utilisateurs en utilisant Google Maps.
 */

import {ai} from '@/ai/genkit';
import { AssistantInput, AssistantInputSchema, AssistantOutput, AssistantOutputSchema } from '@/lib/types';
import { z } from 'genkit';
import { MAJOR_AXES } from '@/lib/constants';

/**
 * Outil permettant à l'IA de vérifier le trafic réel sur un axe de Kinshasa.
 */
const getTrafficOnRoad = ai.defineTool(
  {
    name: 'getTrafficOnRoad',
    description: 'Récupère l\'état du trafic en temps réel pour un axe spécifique de Kinshasa (vitesse, retard, statut).',
    inputSchema: z.object({
      roadName: z.string().describe('Le nom de la route ou du boulevard (ex: Boulevard du 30 Juin, By-Pass, Poids Lourds).'),
    }),
    outputSchema: z.object({
        road: z.string(),
        status: z.string(),
        speed: z.number(),
        delay: z.number(),
        message: z.string(),
    }),
  },
  async (input) => {
    const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
    
    // Recherche de l'axe le plus proche dans notre référentiel de 100 axes
    const road = MAJOR_AXES.find(a => 
        a.name.toLowerCase().includes(input.roadName.toLowerCase()) ||
        input.roadName.toLowerCase().includes(a.name.toLowerCase())
    ) || MAJOR_AXES[0];

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const body = {
      origin: { location: { latLng: { latitude: road.origin.lat, longitude: road.origin.lng } } },
      destination: { location: { latLng: { latitude: road.destination.lat, longitude: road.destination.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      departureTime: new Date(Date.now() + 10000).toISOString(),
      computeAlternativeRoutes: false,
      languageCode: "fr-FR",
      units: "METRIC"
    };

    try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters'
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        const route = data?.routes?.[0];

        if (!route) {
            return { road: road.name, status: "INCONNU", speed: 0, delay: 0, message: "Désolé, je n'arrive pas à joindre les capteurs GPS pour cet axe pour le moment." };
        }

        const duration = parseInt((route.duration ?? "0s").replace('s', '')) || 1;
        const staticDuration = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', '')) || 1;
        const distance = route.distanceMeters ?? 0;
        const delayMinutes = Math.round(Math.max(0, duration - staticDuration) / 60);
        const speedKmh = Math.round((distance / 1000) / (duration / 3600)) || 0;

        let status = "FLUIDE";
        if (speedKmh < 10 || delayMinutes > 10) status = "EMBOUTEILLAGE";
        else if (speedKmh <= 20 || delayMinutes >= 5) status = "DENSE";
        else if (speedKmh <= 35 || delayMinutes >= 2) status = "MODÉRÉ";

        return {
            road: road.name,
            status,
            speed: speedKmh,
            delay: delayMinutes,
            message: `Résultat réel : Le trafic sur ${road.name} est ${status}. Vitesse : ${speedKmh} km/h. Retard : ${delayMinutes} min.`
        };
    } catch (e) {
        return { road: road.name, status: "ERREUR", speed: 0, delay: 0, message: "Erreur technique lors de la récupération des données Google Maps." };
    }
  }
);

const prompt = ai.definePrompt({
  name: 'routeAssistantPrompt',
  input: {schema: AssistantInputSchema},
  output: {schema: AssistantOutputSchema},
  tools: [getTrafficOnRoad],
  prompt: `Vous êtes l'assistant expert 'K-Flow Assistant' pour la ville de Kinshasa. 
Votre mission est d'aider les Kinois à naviguer intelligemment dans les embouteillages.

RÈGLES CRITIQUES :
1. UTILISEZ l'outil 'getTrafficOnRoad' dès que l'utilisateur demande l'état d'une route, d'un quartier ou un itinéraire. C'est votre source de vérité.
2. ANALYSEZ les données renvoyées par l'outil (vitesse, retard) pour donner un conseil pertinent.
3. PARLEZ Français ou Lingala (ou un mélange des deux, le "Frangala" kinois) selon la langue de l'utilisateur.
4. Si le trafic est saturé sur un boulevard, suggérez des alternatives connues (ex: passer par des avenues secondaires).
5. Soyez amical et encourageant ("Courage na nzela", "Tosa trafic").

Question de l'utilisateur : {{{question}}}`,
});

export async function askAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return routeAssistantFlow(input);
}

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
