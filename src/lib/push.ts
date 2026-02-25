'use client';

import { Firestore, doc, setDoc, collection, getDocs, query, where, deleteDoc, serverTimestamp } from "firebase/firestore";

/**
 * Saves a standard Web Push subscription to Firestore.
 */
export async function saveSubscription(
    firestore: Firestore,
    userId: string,
    subscription: PushSubscriptionJSON
) {
    if (!userId || !subscription.endpoint) {
        throw new Error("User ID and subscription endpoint are required.");
    }
    const subscriptionsRef = collection(firestore, 'users', userId, 'pushSubscriptions');
    
    const q = query(subscriptionsRef, where("endpoint", "==", subscription.endpoint));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newSubscriptionRef = doc(subscriptionsRef);
        await setDoc(newSubscriptionRef, { ...subscription, createdAt: serverTimestamp() });
    } else {
        console.log("Subscription already exists.");
    }
}

/**
 * Saves an FCM Token to Firestore. This allows sending messages from the Firebase Console.
 */
export async function saveFCMToken(
    firestore: Firestore,
    userId: string,
    token: string
) {
    if (!userId || !token) return;
    
    const tokensRef = collection(firestore, 'users', userId, 'fcmTokens');
    const q = query(tokensRef, where("token", "==", token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newTokenRef = doc(tokensRef);
        await setDoc(newTokenRef, { 
            token, 
            createdAt: serverTimestamp(),
            platform: 'web'
        });
    }
}

export async function deleteSubscription(
    firestore: Firestore,
    userId: string,
    subscription: PushSubscriptionJSON
) {
    if (!userId || !subscription.endpoint) {
        throw new Error("User ID and subscription endpoint are required.");
    }
    const subscriptionsRef = collection(firestore, 'users', userId, 'pushSubscriptions');
    
    const q = query(subscriptionsRef, where("endpoint", "==", subscription.endpoint));
    const querySnapshot = await getDocs(q);

    for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
    }
}
