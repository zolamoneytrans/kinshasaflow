'use client';

import React, { useState, useEffect } from 'react';
import WelcomePage from '@/components/welcome-page';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

/**
 * Point d'entrée de l'application.
 * Redirige vers le Chat Communautaire si l'utilisateur est connecté pour en faire la landing feature.
 */
export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirection automatique vers le Chat pour les utilisateurs connectés
  useEffect(() => {
    if (isMounted && !isUserLoading && user) {
      router.push('/community-chat');
    }
  }, [isMounted, isUserLoading, user, router]);

  // Affiche un squelette de chargement pendant que le code côté client s'hydrate ou que l'auth se vérifie
  if (!isMounted || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <Skeleton className="h-10 w-48 mb-12" />
        <Skeleton className="h-16 w-3/4 max-w-2xl mb-6" />
        <Skeleton className="h-6 w-full max-w-xl mb-10" />
        <Skeleton className="h-14 w-56" />
      </div>
    );
  }

  // Si l'utilisateur est déjà connecté, on ne rend rien car le useEffect va rediriger
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <Skeleton className="h-12 w-12 rounded-full animate-spin border-4 border-primary border-t-transparent" />
        <p className="mt-4 font-black text-xs uppercase tracking-widest text-slate-400">Ouverture de Radio Trottoir...</p>
      </div>
    );
  }

  return <WelcomePage />;
}
