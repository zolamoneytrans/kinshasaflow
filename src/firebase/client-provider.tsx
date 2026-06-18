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
    // Initialisation de Firebase côté client
    return initializeFirebase();
  }, []);

  // On s'assure que la clé API est présente avant de rendre le provider
  if (!CONFIG.GOOGLE_MAPS_API_KEY) {
    console.error("CRITICAL: Google Maps API Key is missing. Check your environment variables.");
  }

  return (
    <APIProvider 
      apiKey={CONFIG.GOOGLE_MAPS_API_KEY} 
      language="fr"
      region="CD"
      onLoad={() => console.log('Google Maps API loaded successfully')}
    >
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
