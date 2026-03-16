
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
 * Récupère les incidents de trafic réels via l'API TomTom pour Kinshasa.
 */
export async function getTomTomTrafficIncidents() {
  const TOMTOM_KEY = "KGPZ8xhBjIIdThtnB8N3M1M2IlKBseJk";
  const minLat = -4.55;
  const minLon = 15.15;
  const maxLat = -4.1;
  const maxLon = 15.6;
  
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails/s3/${minLat},${minLon},${maxLat},${maxLon}/12/-1/json?key=${TOMTOM_KEY}&language=fr-FR&categoryFilter=0,1,6,9`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } }); 
    if (!response.ok) throw new Error('TomTom API Error');
    const data = await response.json();
    return data.incidents || [];
  } catch (error) {
    console.error("Failed to fetch TomTom incidents:", error);
    return [];
  }
}

/**
 * Initie un paiement Mobile Money via MbiyoPay.
 * Utilise les clés de production et l'URL de webhook fournies par l'utilisateur.
 */
export async function initiateMbiyoPaymentAction(params: {
    amount: number;
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
        console.log(`Initiating MbiyoPay request for ${params.phone} (${params.network}) - Amount: ${params.amount}`);
        
        const response = await fetch("https://api.mbiyo.africa/v1/merchant/payin", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                amount: Math.round(params.amount),
                currency: "CDF",
                phone: params.phone,
                network: params.network.toUpperCase(),
                reference: `KFLOW-${Date.now()}`,
                description: params.description,
                callback_url: webhookUrl,
            }),
        });

        const text = await response.text();
        console.log("MbiyoPay API Raw Response:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON from MbiyoPay:", text);
            return { success: false, error: "Réponse invalide du serveur MbiyoPay." };
        }
        
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.error || "La transaction a été rejetée par l'API MbiyoPay." };
        }
    } catch (error: any) {
        console.error("MbiyoPay Connection Error:", error);
        return { success: false, error: "Impossible de joindre le service MbiyoPay. Vérifiez votre connexion internet serveur." };
    }
}
