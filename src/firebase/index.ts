'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION WITHOUT EXTREME CARE
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  let messaging = null;

  // We wrap messaging in isSupported() check and try-catch 
  // to prevent launch errors on restricted browsers or test environments (like Apple Review)
  if (typeof window !== 'undefined') {
    try {
      // isSupported() is an async check in newer Firebase versions
      // but here we check window object first
      messaging = getMessaging(firebaseApp);
    } catch (e) {
      console.warn('Firebase Messaging is not supported or failed to initialize in this environment.', e);
    }
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    messaging,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
