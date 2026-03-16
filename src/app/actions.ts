
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
 * Utilise TRAFFIC_AWARE_OPTIMAL pour une précision maximale.
 */
export async function getGoogleTrafficStatusAction(axes: { name: string, origin: { lat: number, lng: number }, destination: { lat: number, lng: number } }[]) {
  const GOOGLE_API_KEY = process.env.GOOGLE_ROUTES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    console.error("GOOGLE_ROUTES_API_KEY is missing in .env");
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
      // Format Protobuf Timestamp requis par l'API v2
      departureTime: {
        seconds: Math.floor(Date.now() / 1000),
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
            const err = await res.text();
            throw new Error(err);
        }
        return res.json();
    }).catch(err => {
        console.error(`Fetch error for ${axis.name}:`, err);
        return null;
    });
  });

  try {
    const results = await Promise.allSettled(requests);
    return results.map((result, index) => {
      const data = result.status === "fulfilled" ? result.value : null;
      const route = data?.routes?.[0];
      
      if (route) {
        // Parsing sécurisé des durées (format "120s")
        const duration = parseInt((route.duration ?? "0s").replace('s', ''));
        const staticDuration = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', ''));
        const distance = route.distanceMeters ?? 0; // en mètres
        
        const delaySeconds = Math.max(0, duration - staticDuration);
        const delayMinutes = Math.round(delaySeconds / 60);
        
        // Calcul vitesse en km/h avec garde-fous
        const speedKmh = duration > 0 && distance > 0
          ? Math.round((distance / 1000) / (duration / 3600))
          : 0;

        /**
         * Logique de classification optimisée :
         * Utilisation de OU (||) pour capturer les ralentissements même sur de courts segments
         * où le retard en minutes peut paraître faible mais la vitesse est critique.
         */
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
    console.error("Google Routes API Error:", error);
    return axes.map(a => ({ road: a.name, status: "INCONNU" as const, speed: 0, delay: 0 }));
  }
}

/**
 * Récupère les incidents de trafic (accidents, fermetures) via TomTom.
 */
export async function getLiveNavigationTrafficAction() {
  const TOMTOM_KEY = process.env.TOMTOM_KEY;
  if (!TOMTOM_KEY) {
    console.error("TOMTOM_KEY is missing in .env");
    return [];
  }

  const minLat = -4.55;
  const minLon = 15.15;
  const maxLat = -4.1;
  const maxLon = 15.6;
  
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails/s3/${minLat},${minLon},${maxLat},${maxLon}/12/-1/json?key=${TOMTOM_KEY}&language=fr-FR&categoryFilter=0,1,6,9`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } }); 
    if (!response.ok) throw new Error('Navigation API Error');
    const data = await response.json();
    return data.incidents || [];
  } catch (error) {
    console.error("Failed to fetch traffic incidents:", error);
    return [];
  }
}

/**
 * Initie un paiement Mobile Money via MbiyoPay.
 */
export async function initiateMbiyoPaymentAction(params: {
    amount: number;
    currency: string;
    phone: string;
    network: string;
    description: string;
}) {
    const apiKey = process.env.MBIYO_API_KEY;
    const webhookUrl = process.env.MBIYO_WEBHOOK_URL || "https://kinshasaflow.online/api/payment-callback";
    
    if (!apiKey) {
        console.error("MBIYO_API_KEY is missing in .env");
        return { success: false, error: "Configuration du paiement manquante (API Key)." };
    }

    try {
        const response = await fetch("https://api.mbiyo.africa/v1/merchant/payin", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                amount: params.amount,
                currency: params.currency.toUpperCase(),
                phone: params.phone,
                network: params.network.toUpperCase(),
                reference: `KFLOW-${Date.now()}`,
                description: params.description,
                callback_url: webhookUrl,
            }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return { success: false, error: "Réponse invalide du serveur MbiyoPay." };
        }
        
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.error || "La transaction a été rejetée." };
        }
    } catch (error: any) {
        console.error("MbiyoPay Connection Error:", error);
        return { success: false, error: "Impossible de joindre le service MbiyoPay." };
    }
}

/**
 * Vérifie le statut d'une transaction MbiyoPay.
 */
export async function checkMbiyoTransactionStatusAction(transactionId: string) {
    const apiKey = process.env.MBIYO_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Clé API manquante." };
    }

    try {
        const response = await fetch(`https://dashboard.mbiyo.africa/api/v1/merchant/transactions/${transactionId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Mbiyo Status Check HTTP Error:", text);
            return { success: false, error: "Impossible de récupérer le statut." };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Mbiyo Status Check Connection Error:", error);
        return { success: false, error: "Erreur de connexion au service." };
    }
}
