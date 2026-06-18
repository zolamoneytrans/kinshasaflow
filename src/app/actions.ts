"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { generateSpeech } from "@/ai/flows/tts-flow";
import { getStrategicInsights } from "@/ai/flows/strategic-insights-flow";
import { TrafficTipsInput, AssistantInput, PushSubscription, StrategicInsightsInput, StrategicInsightsOutput, RoadConditionReport } from "@/lib/types";
import * as webpush from 'web-push';
import * as nodemailer from 'nodemailer';
import { initializeFirebase } from "@/firebase";
import { collection, getDocs, query, where, Timestamp, limit } from "firebase/firestore";
import { CONFIG } from "@/lib/config";

const GOOGLE_API_KEY = CONFIG.GOOGLE_MAPS_API_KEY;

/**
 * Cache simple pour éviter les appels API redondants (90 secondes)
 */
const trafficCache = new Map<string, { data: any, expires: number }>();

export async function checkTrafficAction(input: { lat: number, lng: number, address?: string }) {
    const cacheKey = `${input.lat.toFixed(4)}-${input.lng.toFixed(4)}`;
    const now = Date.now();

    if (trafficCache.has(cacheKey) && trafficCache.get(cacheKey)!.expires > now) {
        return trafficCache.get(cacheKey)!.data;
    }

    try {
        const { firestore } = initializeFirebase();
        
        // 1. Chercher les rapports communautaires récents (Fallback simple sans index complexe)
        const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);
        let localReport = null;
        
        try {
            const reportsQuery = query(
                collection(firestore, 'road_condition_reports'),
                where('status', '==', 'active'),
                limit(20)
            );
            const reportsSnap = await getDocs(reportsQuery);
            const recentReports = reportsSnap.docs.map(d => d.data() as RoadConditionReport);
            localReport = recentReports.find(r => 
                Math.abs(r.coords.lat - input.lat) < 0.008 && 
                Math.abs(r.coords.lng - input.lng) < 0.008
            );
        } catch (dbError) {
            console.warn("[TrafficCheck] Firestore bypass:", dbError);
        }

        // 2. Appel à Google Routes API v2
        const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
        const body = {
            origin: { location: { latLng: { latitude: input.lat, longitude: input.lng } } },
            destination: { location: { latLng: { latitude: input.lat + 0.004, longitude: input.lng + 0.004 } } },
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE_OPTIMAL",
            computeAlternativeRoutes: false,
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

        if (!res.ok) {
            const errorBody = await res.text();
            console.error("[Routes API Error]", res.status, errorBody);
            throw new Error(`Google API returned ${res.status}`);
        }

        const data = await res.json();
        const route = data?.routes?.[0];
        
        let result: any = {
            status: "INCONNU",
            verdict: "Analyse en cours — soyez prudent sur cet axe.",
            lingala: "Tozali kotala nzela — keba na tamboli na yo.",
            delay: 0,
            ratio: 1,
            alternatives: []
        };

        if (route) {
            const dur = parseInt((route.duration ?? "0s").replace('s', '')) || 1;
            const statDur = parseInt((route.staticDuration ?? route.duration ?? "0s").replace('s', '')) || 1;
            const ratio = dur / statDur;
            const delay = Math.round(Math.max(0, dur - statDur) / 60);

            if (ratio > 2.2) result.status = "BLOQUÉ";
            else if (ratio > 1.6) result.status = "EMBOUTEILLÉ";
            else if (ratio > 1.25) result.status = "MODÉRÉ";
            else result.status = "FLUIDE";

            if (localReport) {
                result.verdict = `Signalement communautaire : ${localReport.description}`;
                result.lingala = "Bato balobi nzela eza pasi, keba mingi.";
            } else {
                if (result.status === "FLUIDE") {
                    result.verdict = "Nzela eza fluide : Trafic normal sur cet axe.";
                    result.lingala = "Nzela eza kitoko, kotambola eza pasi te.";
                } else {
                    result.verdict = `${input.address || 'Cet axe'} semble ralenti par environ ${delay} min de trafic.`;
                    result.lingala = "Nzela eza pasi moke, zela mwa moke.";
                }
            }

            result.delay = delay;
            result.ratio = ratio;
        }

        trafficCache.set(cacheKey, { data: result, expires: now + 90000 });
        return result;

    } catch (e) {
        console.error("Critical Traffic Check Error:", e);
        return { 
            status: "ERREUR", 
            verdict: "L'analyseur K-Flow est momentanément indisponible.",
            lingala: "Machine ezo sala te, zela mwa moke."
        };
    }
}

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

                return { road: axis.name, status, speed, delay };
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
    return { success: false, error: "VAPID keys are not configured." };
  }

  webpush.setVapidDetails('mailto:drnduwa@gmail.com', vapidPublicKey, vapidPrivateKey);

  try {
    await webpush.sendNotification(subscription as any, payload);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
    console.warn("[Email Broadcast] Erreur liste utilisateurs.");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const mailOptions = {
    from: `"Kinshasa Flow Alerts" <${smtpUser}>`,
    to: smtpUser, 
    bcc: recipientList, 
    subject: `🚨 ALERTE K-FLOW : ${params.type.toUpperCase()} à ${params.location}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="background-color: #248eeb; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Kinshasa Flow</h1>
          </div>
          <div style="padding: 40px;">
            <h2>Signalement en direct</h2>
            <p><strong>Type :</strong> ${params.type}</p>
            <p><strong>Lieu :</strong> ${params.location}</p>
            <p><strong>Par :</strong> ${params.userName}</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://kinshasaflow.online/community-chat" style="background-color: #248eeb; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">VOIR LE CHAT</a>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
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

        if (!response.ok) return { success: false, error: "Erreur serveur." };
        const result = await response.json();
        return { success: true, data: { id: result.data.id, status: result.data.status } };
    } catch (error) {
        return { success: false, error: "Connexion impossible." };
    }
}

export async function checkMbiyoTransactionStatusAction(transactionId: string) {
    try {
        const response = await fetch(`https://dashboard.mbiyo.africa/api/v1/merchant/transactions/${transactionId}`, {
            method: "GET",
            headers: { "Authorization": "Bearer COjbIMdkfbeZ8RJUH03oj0kNKJLzCK", "Content-Type": "application/json" }
        });
        const result = await response.json();
        return { success: true, data: { status: String(result.data.status).toLowerCase() } };
    } catch (error) {
        return { success: false, error: "Erreur réseau." };
    }
}
