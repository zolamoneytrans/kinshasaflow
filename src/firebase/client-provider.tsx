'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CONFIG } from '@/lib/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <APIProvider apiKey={CONFIG.GOOGLE_MAPS_API_KEY} language="fr">
      <FirebaseProvider
        firebaseApp={firebaseServices.firebaseApp}
        auth={firebaseServices.auth}
        firestore={firebaseServices.firestore}
        messaging={firebaseServices.messaging}
      >
        {children}
      </FirebaseProvider>
    </APIProvider>
  );
}
