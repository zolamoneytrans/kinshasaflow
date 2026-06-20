'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CONFIG } from '@/lib/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Liste des librairies Google Maps nécessaires à l'application
const LIBRARIES = ['places', 'marker', 'geometry', 'routes'];

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialisation de Firebase côté client
    return initializeFirebase();
  }, []);

  return (
    <APIProvider 
      apiKey={CONFIG.GOOGLE_MAPS_API_KEY} 
      libraries={LIBRARIES as any}
      language="fr"
      region="CD"
      onLoad={() => console.log('Google Maps API initialized with key Kinshasaflow 3')}
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
