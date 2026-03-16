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
 * Récupère le statut réel du trafic via Google Distance Matrix API.
 * Compare le temps de trajet normal vs temps de trajet actuel.
 */
export async function getGoogleTrafficStatusAction(axes: { name: string, lat: number, lng: number }[]) {
  const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
  
  // On crée des segments courts (0.5km) pour tester le trafic local
  const requests = axes.map(axis => {
    const origin = `${axis.lat},${axis.lng}`;
    // On simule un point d'arrivée à 500m de distance pour capter le trafic local
    const destination = `${axis.lat + 0.005},${axis.lng + 0.005}`;
    return fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&departure_time=now&key=${GOOGLE_API_KEY}`
    ).then(res => res.json());
  });

  try {
    const results = await Promise.all(requests);
    return results.map((data, index) => {
      const element = data.rows?.[0]?.elements?.[0];
      if (element?.status === "OK") {
        const duration = element.duration.value; // secondes
        const durationInTraffic = element.duration_in_traffic.value; // secondes
        const delay = Math.max(0, durationInTraffic - duration);
        const ratio = durationInTraffic / duration;

        return {
          road: axes[index].name,
          duration,
          durationInTraffic,
          delay: Math.round(delay / 60),
          ratio,
          status: ratio > 2.0 ? "BLOQUÉ" : ratio > 1.5 ? "SATURÉ" : ratio > 1.2 ? "RALENTI" : "FLUIDE"
        };
      }
      return { road: axes[index].name, status: "FLUIDE", delay: 0, ratio: 1 };
    });
  } catch (error) {
    console.error("Google Traffic Status Error:", error);
    return axes.map(a => ({ road: a.name, status: "FLUIDE", delay: 0, ratio: 1 }));
  }
}

/**
 * Récupère les incidents de trafic (accidents, fermetures) via TomTom.
 */
export async function getLiveNavigationTrafficAction() {
  const TOMTOM_KEY = "KGPZ8xhBjIIdThtnB8N3M1M2IlKBseJk";
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
    const webhookUrl = process.env.MBIYO_WEBHOOK_URL || "https://www.zolamoneytrans.com/mbiyopay/notifications.php";
    
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
