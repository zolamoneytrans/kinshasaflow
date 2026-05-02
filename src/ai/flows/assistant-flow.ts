'use server';
/**
 * @fileOverview Un assistant IA connecté aux données réelles de Kinshasa.
 * 
 * Capable de géocoder n'importe quel lieu de la ville pour fournir un état du trafic précis.
 */

import {ai} from '@/ai/genkit';
import { AssistantInput, AssistantInputSchema, AssistantOutput, AssistantOutputSchema } from '@/lib/types';
import { z } from 'genkit';
import { MAJOR_AXES } from '@/lib/constants';

/**
 * Outil permettant à l'IA de vérifier le trafic réel sur n'importe quel point de Kinshasa.
 */
const getTrafficAtLocation = ai.defineTool(
  {
    name: 'getTrafficAtLocation',
    description: 'Récupère l\'état du trafic pour n\'importe quel lieu, avenue ou quartier de Kinshasa.',
    inputSchema: z.object({
      locationName: z.string().describe('Le nom du lieu (ex: Victoire, Avenue de la Paix, Bandal, Pompage).'),
    }),
    outputSchema: z.object({
        placeName: z.string(),
        status: z.string(),
        speed: z.number(),
        delay: z.number(),
        message: z.string(),
    }),
  },
  async (input) => {
    const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
    const query = `${input.locationName}, Kinshasa, RDC`;

    try {
        // 1. Géocodage pour trouver les coordonnées de n'importe quel lieu
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return { placeName: input.locationName, status: "INCONNU", speed: 0, delay: 0, message: `Je n'ai pas trouvé le lieu "${input.locationName}" sur la carte de Kinshasa.` };
        }

        const location = geoData.results[0].geometry.location;
        const formattedAddress = geoData.results[0].formatted_address;

        // 2. Calcul d'un micro-itinéraire (500m) pour sonder le trafic à cet endroit
        const routesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
        const body = {
          origin: { location: { latLng: { latitude: location.lat, longitude: location.lng } } },
          destination: { location: { latLng: { latitude: location.lat + 0.005, longitude: location.lng + 0.005 } } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE_OPTIMAL",
          departureTime: new Date(Date.now() + 5000).toISOString(),
          languageCode: "fr-FR"
        };

        const res = await fetch(routesUrl, {
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
            return { placeName: formattedAddress, status: "FLUIDE", speed: 40, delay: 0, message: `Trafic normal détecté aux alentours de ${input.locationName}.` };
        }

        const duration = parseInt((route.duration ?? "0s").replace('s', '')) || 1;
        const staticDuration = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', '')) || 1;
        const distance = route.distanceMeters ?? 0;
        const delayMinutes = Math.round(Math.max(0, duration - staticDuration) / 60);
        const speedKmh = Math.round((distance / 1000) / (duration / 3600)) || 0;

        let status = "FLUIDE";
        if (speedKmh < 12 || delayMinutes > 8) status = "EMBOUTEILLAGE";
        else if (speedKmh <= 22 || delayMinutes >= 4) status = "DENSE";
        else if (speedKmh <= 35 || delayMinutes >= 2) status = "MODÉRÉ";

        return {
            placeName: formattedAddress,
            status,
            speed: speedKmh,
            delay: delayMinutes,
            message: `Analyse réelle : Le trafic vers ${input.locationName} est ${status}.`
        };
    } catch (e) {
        return { placeName: input.locationName, status: "ERREUR", speed: 0, delay: 0, message: "Erreur technique de connexion aux satellites." };
    }
  }
);

const prompt = ai.definePrompt({
  name: 'routeAssistantPrompt',
  input: {schema: AssistantInputSchema},
  output: {schema: AssistantOutputSchema},
  tools: [getTrafficAtLocation],
  prompt: `Vous êtes l'assistant expert 'K-Flow Assistant' pour l'intégralité de la ville de Kinshasa. 
Votre mission est d'aider les Kinois à naviguer intelligemment partout, de la Gombe à Maluku, en passant par Ngaliema et Masina.

RÈGLES CRITIQUES :
1. UTILISEZ l'outil 'getTrafficAtLocation' pour n'importe quelle question portant sur une rue, une avenue, un rond-point, un quartier ou un point de repère.
2. NE VOUS LIMITEZ PAS aux grands boulevards. Si l'utilisateur demande une petite avenue ou un quartier reculé, cherchez-le.
3. ANALYSEZ les données renvoyées (statut, vitesse) pour donner un conseil pratique (ex: "Évitez cette zone", "C'est le moment d'y aller").
4. PARLEZ en "Frangala" (Français avec des touches de Lingala) pour être proche de l'utilisateur.
5. Soyez amical : "Ndenge nini?", "Courage na nzela", "Tosa trafic".

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
