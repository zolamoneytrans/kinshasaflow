'use client';

import { useEffect } from 'react';

/**
 * Composant utilitaire qui écoute les erreurs de type 'ChunkLoadError' globalement.
 * Si un chunk échoue au chargement (souvent après un nouveau déploiement),
 * la page est automatiquement rechargée pour récupérer les derniers scripts.
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const errorMsg = e.message || '';
      const errorName = e.error?.name || '';

      if (
        errorMsg.includes('Loading chunk') || 
        errorMsg.includes('chunk') ||
        errorName === 'ChunkLoadError'
      ) {
        console.warn('ChunkLoadError détecté. Rechargement de la page pour récupérer les nouveaux scripts...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
