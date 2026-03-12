'use client';

import { useEffect } from 'react';

/**
 * Composant utilitaire qui écoute les erreurs de type 'ChunkLoadError' globalement.
 * Si un chunk échoue au chargement (souvent après un nouveau déploiement ou un timeout),
 * la page est automatiquement rechargée pour récupérer les derniers scripts.
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const handleError = (e: ErrorEvent | PromiseRejectionEvent) => {
      // Extraction de l'erreur qu'elle vienne d'un événement standard ou d'une promesse
      const error = (e as any).error || (e as any).reason || e;
      const errorMsg = error?.message || (typeof error === 'string' ? error : '');
      const errorName = error?.name || '';

      // Détection des erreurs de chargement de modules ou de timeout réseau
      const isChunkError = 
        errorMsg.includes('Loading chunk') || 
        errorMsg.includes('chunk') ||
        errorName === 'ChunkLoadError' ||
        errorMsg.includes('timeout');

      if (isChunkError) {
        console.warn('Problème de chargement de module détecté. Rechargement de la page...', errorMsg);
        
        // Petit délai pour éviter les boucles de rechargement infinies si le serveur est HS
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 5000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}