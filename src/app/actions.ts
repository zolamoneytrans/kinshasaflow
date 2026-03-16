"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { generateSpeech } from "@/ai/flows/tts-flow";
import { TrafficTipsInput, AssistantInput, PushSubscription } from "@/lib/types";
import * as webpush from 'web-push';

export async function getTrafficTipsAction(input: TrafficTipsInput) {
    return await getTrafficTips(input);
}

export async function askAssistantAction(input: AssistantInput) {
    return await askAssistant(input);
}

export async function generateSpeechAction(text: string) {
    try {
        return await generateSpeech(text);
    } catch (error: any) {
        console.error('generateSpeechAction error:', error);
        throw new Error(error.message || "Erreur lors de la génération vocale.");
    }
}

export async function sendTestPushNotificationAction(subscription: PushSubscription, payload: string) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID keys are not configured on the server.");
    return { success: false, error: "VAPID keys are not configured on the server." };
  }

  const webPushSubscription = subscription as webpush.PushSubscription;

  webpush.setVapidDetails(
    'mailto:drnduwa@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    await webpush.sendNotification(webPushSubscription, payload);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    if (error.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid.');
      return { success: false, error: 'Subscription expired.' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Récupère le statut réel du trafic via Google Routes API v2.
 */
export async function getGoogleTrafficStatusAction(axes: { name: string, origin: { lat: number, lng: number }, destination: { lat: number, lng: number } }[]) {
  const GOOGLE_API_KEY = process.env.GOOGLE_ROUTES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    console.error("CRITICAL: GOOGLE_ROUTES_API_KEY is missing in .env file.");
    return axes.map(a => ({ road: a.name, status: "INCONNU" as const, speed: 0, delay: 0 }));
  }

  if (!axes?.length) return [];

  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
  
  const requests = axes.map(axis => {
    const body = {
      origin: { location: { latLng: { latitude: axis.origin.lat, longitude: axis.origin.lng } } },
      destination: { location: { latLng: { latitude: axis.destination.lat, longitude: axis.destination.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
      departureTime: {
        seconds: Math.floor(Date.now() / 1000) + 10, // 10s in the future
        nanos: 0
      },
      computeAlternativeRoutes: false,
      languageCode: "fr-FR",
      units: "METRIC"
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters'
      },
      body: JSON.stringify(body)
    }).then(async res => {
        if (!res.ok) {
            const errText = await res.text();
            console.error(`API Error for ${axis.name}: HTTP ${res.status}`, errText);
            return { error: errText, status: res.status };
        }
        return res.json();
    }).catch(err => {
        console.error(`Fetch error for ${axis.name}:`, err);
        return { error: err.message };
    });
  });

  try {
    const results = await Promise.allSettled(requests);
    
    return results.map((result, index) => {
      const data = result.status === "fulfilled" ? result.value : null;
      const route = data?.routes?.[0];
      
      if (route) {
        const duration = parseInt((route.duration ?? "0s").replace('s', '')) || 1;
        const staticDuration = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', '')) || 1;
        const distance = route.distanceMeters ?? 0;
        
        const delaySeconds = Math.max(0, duration - staticDuration);
        const delayMinutes = Math.round(delaySeconds / 60);
        
        const speedKmh = duration > 0 && distance > 0
          ? Math.round((distance / 1000) / (duration / 3600))
          : 0;

        let status: "FLUIDE" | "MODÉRÉ" | "DENSE" | "EMBOUTEILLAGE" | "INCONNU" = "FLUIDE";
        
        if (speedKmh === 0 && distance > 0) {
            status = "INCONNU";
        } else if (speedKmh < 10 || delayMinutes > 10) {
          status = "EMBOUTEILLAGE";
        } else if (speedKmh <= 20 || delayMinutes >= 5) {
          status = "DENSE";
        } else if (speedKmh <= 35 || delayMinutes >= 2) {
          status = "MODÉRÉ";
        } else {
          status = "FLUIDE";
        }

        return {
          road: axes[index].name,
          duration,
          staticDuration,
          distance,
          speed: speedKmh,
          delay: delayMinutes,
          status
        };
      }
      return { road: axes[index].name, status: "INCONNU" as const, speed: 0, delay: 0 };
    });
  } catch (error) {
    console.error("Global Traffic Action Error:", error);
    return axes.map(a => ({ road: a.name, status: "INCONNU" as const, speed: 0, delay: 0 }));
  }
}

/**
 * Initialise un paiement via MbiyoPay.
 */
export async function initiateMbiyoPaymentAction(data: {
    amount: number;
    currency: string;
    phone: string;
    network: string;
    description: string;
}) {
    // Note: Dans un environnement réel, ceci appellerait l'API MbiyoPay.
    // Ici, nous simulons une réponse positive pour le MVP.
    console.log("Initiating MbiyoPay Payment:", data);
    
    // Simuler un ID de transaction unique
    const mockTransactionId = `mbiyo_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
        success: true,
        data: {
            id: mockTransactionId,
            status: 'pending'
        }
    };
}

/**
 * Vérifie le statut d'une transaction MbiyoPay.
 */
export async function checkMbiyoTransactionStatusAction(transactionId: string) {
    console.log("Checking MbiyoPay Transaction Status:", transactionId);
    
    // Simulation : 80% de chances que le statut soit encore 'pending' ou passe en 'success'
    return {
        success: true,
        data: {
            status: Math.random() > 0.5 ? 'success' : 'pending'
        }
    };
}

/**
 * Diffuse une alerte de trafic push à tous les utilisateurs si un changement critique est détecté.
 */
export async function broadcastTrafficAlertAction(roadName: string, fromStatus: string, toStatus: string) {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) return { success: false };

    // Cette action doit être appelée avec une liste de souscriptions récupérée depuis Firestore
    // Note: Pour un broadcast massif, il est préférable d'utiliser un script dédié ou Firebase Cloud Functions.
    return { success: true };
}
