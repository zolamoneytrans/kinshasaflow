'use client';

import React, { useState, useEffect } from 'react';
import WelcomePage from '@/components/welcome-page';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Point d'entrée de l'application.
 * Utilisation d'un import standard au lieu de next/dynamic pour éviter les erreurs ChunkLoadError
 * lors du chargement initial, fréquentes dans les environnements PWA après un déploiement.
 */
export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Affiche un squelette de chargement pendant que le code côté client s'hydrate
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <Skeleton className="h-10 w-48 mb-12" />
        <Skeleton className="h-16 w-3/4 max-w-2xl mb-6" />
        <Skeleton className="h-6 w-full max-w-xl mb-10" />
        <Skeleton className="h-14 w-56" />
      </div>
    );
  }

  return <WelcomePage />;
}
