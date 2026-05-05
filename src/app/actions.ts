"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { generateSpeech } from "@/ai/flows/tts-flow";
import { getStrategicInsights } from "@/ai/flows/strategic-insights-flow";
import { TrafficTipsInput, AssistantInput, PushSubscription, StrategicInsightsInput, StrategicInsightsOutput } from "@/lib/types";
import * as webpush from 'web-push';

export async function getTrafficTipsAction(input: TrafficTipsInput) {
    try {
        return await getTrafficTips(input);
    } catch (e) {
        console.error("Traffic Tips Error:", e);
        return { tips: ["Restez vigilant", "Vérifiez votre GPS"] };
    }
}

export async function askAssistantAction(input: AssistantInput) {
    try {
        return await askAssistant(input);
    } catch (e) {
        console.error("Assistant Error:", e);
        return { answer: "Désolé, je rencontre une difficulté technique. Réessayez dans un instant." };
    }
}

/**
 * Action serveur pour la génération vocale de l'assistant.
 */
export async function generateSpeechAction(text: string) {
    try {
        return await generateSpeech(text);
    } catch (error: any) {
        console.error('generateSpeechAction error:', error);
        throw new Error(error.message || "Erreur lors de la génération vocale.");
    }
}

export async function getStrategicInsightsAction(input: StrategicInsightsInput): Promise<StrategicInsightsOutput> {
  try {
    const result = await getStrategicInsights(input);
    if (!result) throw new Error("No data returned from AI flow");
    return result;
  } catch (error: any) {
    console.error("Strategic Insights Action Error:", error);
    return {
      globalAdvice: "Analyse momentanément indisponible. Restez prudents sur les routes.",
      tips: ["Vérifiez vos rétroviseurs", "Gardez vos distances de sécurité", "Évitez les axes saturés"],
      trend: "stable"
    };
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
  const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
  
  if (!GOOGLE_API_KEY) {
    console.error("CRITICAL: GOOGLE_ROUTES_API_KEY is missing.");
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
      departureTime: new Date(Date.now() + 10000).toISOString(),
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
        if (!res.ok) return { error: "API Error" };
        return res.json();
    }).catch(err => ({ error: err.message }));
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
        
        // Calcul plus précis de la vitesse
        const speedKmh = duration > 0 && distance > 0
          ? Math.round((distance / 1000) / (duration / 3600))
          : 0;

        let status: "FLUIDE" | "MODÉRÉ" | "DENSE" | "EMBOUTEILLAGE" | "INCONNU" = "FLUIDE";
        
        if (speedKmh <= 8 || delayMinutes > 10) {
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
    return axes.map(a => ({ road: a.name, status: "INCONNU" as const, speed: 0, delay: 0 }));
  }
}

/**
 * Initialise un paiement via MbiyoPay pour la RDC (CD).
 */
export async function initiateMbiyoPaymentAction(data: {
    amount: number;
    currency: string;
    phone: string;
    network: string;
    order_id: string;
}): Promise<{ success: boolean; data?: { id: string; status: string }; error?: string }> {
    try {
        const phoneWithPlus = data.phone.startsWith('+') ? data.phone : `+${data.phone}`;
        
        const payload = {
            amount: data.amount,
            currency: data.currency,
            payment_method: "mobile_money",
            order_id: data.order_id,
            callback_url: "https://kinshasaflow.online/api/payment-callback",
            metadata: {
                network: data.network.toLowerCase(),
                phone_number: phoneWithPlus,
                country_code: "CD"
            }
        };

        const response = await fetch(
            "https://dashboard.mbiyo.africa/api/v1/merchant/payin",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer COjbIMdkfbeZ8RJUH03oj0kNKJLzCK",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            }
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return { success: false, error: "Réponse invalide du serveur de paiement." };
        }

        if (!response.ok) {
            const errorJson = await response.json();
            return { success: false, error: errorJson.message || `Erreur API (${response.status})` };
        }

        const result = await response.json();
        
        if (result.status === "success" && result.data) {
            return {
                success: true,
                data: {
                    id: result.data.id,
                    status: result.data.status || 'pending'
                }
            };
        }

        return { success: false, error: result.message || "L'API MbiyoPay a renvoyé un succès sans données." };
    } catch (error: any) {
        return { success: false, error: "Impossible de joindre le service de paiement." };
    }
}

/**
 * Vérifie le statut d'une transaction via l'API MbiyoPay.
 */
export async function checkMbiyoTransactionStatusAction(transactionId: string): Promise<{ success: boolean; data?: { status: string }; error?: string }> {
    try {
        const response = await fetch(
            `https://dashboard.mbiyo.africa/api/v1/merchant/transactions/${transactionId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer COjbIMdkfbeZ8RJUH03oj0kNKJLzCK",
                    "Content-Type": "application/json",
                }
            }
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return { success: false, error: "Réponse invalide." };
        }

        if (!response.ok) {
            const errorJson = await response.json();
            return { success: false, error: errorJson.message || `Erreur serveur (${response.status})` };
        }

        const result = await response.json();
        
        if (result.status === "success" && result.data) {
            const txStatus = String(result.data.status).toLowerCase();
            return {
                success: true,
                data: {
                    status: txStatus
                }
            };
        }

        return { success: false, error: result.message || "La réponse de MbiyoPay est incomplète." };
    } catch (error: any) {
        return { success: false, error: "Erreur réseau lors de la vérification." };
    }
}
