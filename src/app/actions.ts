
"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { generateSpeech } from "@/ai/flows/tts-flow";
import { getStrategicInsights } from "@/ai/flows/strategic-insights-flow";
import { TrafficTipsInput, AssistantInput, PushSubscription, StrategicInsightsInput, StrategicInsightsOutput } from "@/lib/types";
import * as webpush from 'web-push';
import * as nodemailer from 'nodemailer';
import { initializeFirebase } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

/**
 * Récupère l'état du trafic en temps réel pour une liste d'axes routiers via Google Routes API.
 */
export async function getGoogleTrafficStatusAction(axes: any[]) {
    try {
        const results = await Promise.all(axes.map(async (axis) => {
            try {
                const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
                const body = {
                    origin: { location: { latLng: { latitude: axis.origin.lat, longitude: axis.origin.lng } } },
                    destination: { location: { latLng: { latitude: axis.destination.lat, longitude: axis.destination.lng } } },
                    travelMode: "DRIVE",
                    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
                    languageCode: "fr-FR"
                };

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
                
                if (!route) return { road: axis.name, status: "INCONNU", speed: 0, delay: 0 };

                const dur = parseInt((route.duration ?? "0s").replace('s', '')) || 1;
                const statDur = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', '')) || 1;
                const delay = Math.round(Math.max(0, dur - statDur) / 60);
                const distKm = (route.distanceMeters / 1000) || 1;
                const speed = Math.round(distKm / (dur / 3600));

                let status = "FLUIDE";
                if (delay > 10) status = "EMBOUTEILLAGE";
                else if (delay > 4) status = "DENSE";
                else if (delay > 1) status = "MODÉRÉ";

                return {
                    road: axis.name,
                    status,
                    speed,
                    delay
                };
            } catch (e) {
                return { road: axis.name, status: "INCONNU", speed: 0, delay: 0 };
            }
        }));
        
        return results;
    } catch (globalError) {
        console.error("Global Traffic Action Error:", globalError);
        return axes.map(a => ({ road: a.name, status: "INCONNU", speed: 0, delay: 0 }));
    }
}

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
      trend: "stable" as const
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

  const webPushSubscription = subscription as any;

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
      return { success: false, error: 'Subscription expired.' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification d'alerte par email à TOUS les utilisateurs via SMTP Gmail.
 */
export async function sendAlertEmailAction(params: { type: string, location: string, userName: string }) {
  const smtpUser = "kinshasaflow@gmail.com";
  const smtpPass = "jrgl kgjl qlqj vmfc";

  let recipientList: string[] = ['drnduwa@gmail.com']; 
  
  try {
    const { firestore } = initializeFirebase();
    const usersSnap = await getDocs(collection(firestore, 'users'));
    const userEmails = usersSnap.docs
      .map(doc => doc.data().email)
      .filter(email => email && email.includes('@') && email !== 'drnduwa@gmail.com');
    
    recipientList = [...recipientList, ...userEmails];
  } catch (e) {
    console.warn("[Email Broadcast] Impossible de récupérer la liste des utilisateurs, envoi à l'admin uniquement.");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"Kinshasa Flow Alerts" <${smtpUser}>`,
    to: smtpUser, 
    bcc: recipientList, 
    subject: `🚨 ALERTE K-FLOW : ${params.type.toUpperCase()} à ${params.location}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #248eeb; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">Kinshasa Flow</h1>
            <p style="color: #e2e8f0; margin-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Rapport de Trafic Communautaire</p>
          </div>
          <div style="padding: 40px;">
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 16px; border-left: 6px solid #248eeb; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">Signalement en direct</h2>
              <p style="margin: 5px 0;"><strong>Type d'alerte :</strong> <span style="text-transform: capitalize; color: #248eeb;">${params.type}</span></p>
              <p style="margin: 5px 0;"><strong>Lieu :</strong> ${params.location}</p>
              <p style="margin: 5px 0;"><strong>Signalé par :</strong> ${params.userName}</p>
              <p style="margin: 5px 0;"><strong>Heure :</strong> ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Un membre de la communauté vient de signaler cet incident sur Radio Trottoir. Ouvrez l'application dès maintenant pour localiser l'événement sur la carte et adapter votre itinéraire en temps réel.
            </p>
            <div style="text-align: center; margin-top: 40px;">
              <a href="https://kinshasaflow.online/community-chat" style="background-color: #248eeb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block;">VOIR DANS LE CHAT</a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 10px; margin: 0;">© ${new Date().getFullYear()} Kinshasa Flow • Swazi Appli Lab sarl</p>
            <p style="color: #cbd5e1; font-size: 8px; margin-top: 5px;">Vous recevez cet email car vous êtes membre de la communauté Kinshasa Flow.</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, count: recipientList.length, messageId: info.messageId };
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message };
  }
}

export async function initiateMbiyoPaymentAction(data: {
    amount: number;
    currency: string;
    phone: string;
    network: string;
    order_id: string;
}) {
    try {
        const phoneWithPlus = data.phone.startsWith('+') ? data.phone : `+${data.phone}`;
        const payload = {
            amount: data.amount,
            currency: data.currency,
            payment_method: "mobile_money",
            order_id: data.order_id,
            callback_url: "https://kinshasaflow.online/api/payment-callback",
            metadata: { network: data.network.toLowerCase(), phone_number: phoneWithPlus, country_code: "CD" }
        };

        const response = await fetch("https://dashboard.mbiyo.africa/api/v1/merchant/payin", {
            method: "POST",
            headers: { "Authorization": "Bearer COjbIMdkfbeZ8RJUH03oj0kNKJLzCK", "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) return { success: false, error: "Erreur serveur de paiement." };
        const result = await response.json();
        if (result.status === "success" && result.data) {
            return { success: true, data: { id: result.data.id, status: result.data.status || 'pending' } };
        }
        return { success: false, error: result.message || "Erreur de paiement." };
    } catch (error) {
        return { success: false, error: "Impossible de joindre le service de paiement." };
    }
}

export async function checkMbiyoTransactionStatusAction(transactionId: string) {
    try {
        const response = await fetch(`https://dashboard.mbiyo.africa/api/v1/merchant/transactions/${transactionId}`, {
            method: "GET",
            headers: { "Authorization": "Bearer COjbIMdkfbeZ8RJUH03oj0kNKJLzCK", "Content-Type": "application/json" }
        });
        if (!response.ok) return { success: false, error: "Erreur serveur." };
        const result = await response.json();
        if (result.status === "success" && result.data) {
            return { success: true, data: { status: String(result.data.status).toLowerCase() } };
        }
        return { success: false, error: "Réponse incomplète." };
    } catch (error) {
        return { success: false, error: "Erreur réseau." };
    }
}
