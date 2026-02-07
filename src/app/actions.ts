"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { TrafficTipsInput, AssistantInput, PushSubscription } from "@/lib/types";
import webpush from 'web-push';

export async function getTrafficTipsAction(input: TrafficTipsInput) {
    return await getTrafficTips(input);
}

export async function askAssistantAction(input: AssistantInput) {
    return await askAssistant(input);
}

export async function sendTestPushNotificationAction(subscription: PushSubscription, payload: string) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("VAPID keys are not configured on the server.");
    return { success: false, error: "VAPID keys are not configured on the server." };
  }

  // The type assertion is needed because the `web-push` library has a slightly different type definition
  // but the structure is compatible with the standard PushSubscriptionJSON object.
  const webPushSubscription = subscription as webpush.PushSubscription;

  webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    await webpush.sendNotification(webPushSubscription, payload);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    // When a subscription is expired, the push service returns a 410 Gone status code.
    if (error.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid.');
      // Here you would typically implement logic to remove the subscription from your database.
      return { success: false, error: 'Subscription expired.' };
    }
    return { success: false, error: error.message };
  }
}
