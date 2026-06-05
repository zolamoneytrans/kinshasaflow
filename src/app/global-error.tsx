'use client';

import { useEffect } from 'react';

/**
 * Gestionnaire d'erreurs global pour Next.js.
 * Capture les erreurs au plus haut niveau (y compris les échecs de chargement du layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Si c'est une erreur de chargement de chunk (module JS manquant ou cache corrompu)
    const errorMsg = error.message || "";
    if (errorMsg.includes('Loading chunk') || errorMsg.includes('ChunkLoadError') || errorMsg.includes('timeout')) {
      console.warn("K-Flow: Échec de chargement détecté au niveau global. Rechargement forcé...");
      
      // Nettoyage des service workers pour purger le cache corrompu
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const registration of registrations) {
            registration.unregister();
          }
          window.location.reload();
        }).catch(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '16px' }}>Chargement interrompu</h2>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
              Une mise à jour ou un problème de connexion nécessite de rafraîchir Kinshasa Flow.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#248eeb',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Actualiser maintenant
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}