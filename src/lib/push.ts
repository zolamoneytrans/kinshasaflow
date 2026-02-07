'use client';

import { Firestore, doc, setDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";

export async function saveSubscription(
    firestore: Firestore,
    userId: string,
    subscription: PushSubscriptionJSON
) {
    if (!userId || !subscription.endpoint) {
        throw new Error("User ID and subscription endpoint are required.");
    }
    const subscriptionsRef = collection(firestore, 'users', userId, 'pushSubscriptions');
    
    // Check if subscription already exists
    const q = query(subscriptionsRef, where("endpoint", "==", subscription.endpoint));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Add new subscription
        const newSubscriptionRef = doc(subscriptionsRef);
        await setDoc(newSubscriptionRef, subscription);
    } else {
        // It exists, do nothing or update if needed. For now, do nothing.
        console.log("Subscription already exists.");
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
