'use client';

import { useEffect } from 'react';

/**
 * Gestionnaire d'erreurs global robuste pour Next.js.
 * Capable de forcer un rechargement propre en cas d'échec de chargement des ressources (Chunks).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Si c'est une erreur liée aux fichiers statiques (Chunks), un timeout ou un échec réseau
    const msg = (error.message || "").toLowerCase();
    const isChunkError = 
      msg.includes('loading chunk') || 
      msg.includes('chunkloaderror') || 
      msg.includes('timeout') || 
      msg.includes('failed to fetch');

    if (isChunkError) {
      console.warn("K-Flow Recovery: Échec de chargement détecté. Tentative de rechargement forcé...");
      
      // Enregistrement de la tentative pour éviter les boucles infinies (max 1 fois par 15s)
      const lastRetry = sessionStorage.getItem('kflow-last-retry-v5');
      const now = Date.now();
      
      if (!lastRetry || (now - parseInt(lastRetry)) > 15000) {
        sessionStorage.setItem('kflow-last-retry-v5', now.toString());
        
        // Nettoyage des caches et rechargement
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
              registration.unregister();
            }
            
            if ('caches' in window) {
              caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key));
              });
            }
            
            window.location.reload();
          }).catch(() => window.location.reload());
        } else {
          window.location.reload();
        }
      }
    }
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-slate-50">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '32px',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
            maxWidth: '450px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.025em' }}>Mise à jour requise</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6', fontWeight: '500' }}>
              Une nouvelle version de Kinshasa Flow est disponible ou la connexion a été interrompue.
            </p>
            <button
              onClick={() => {
                // Forcer le rechargement en ignorant le cache navigateur
                window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
              }}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#248eeb',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 10px 15px -3px rgba(36, 142, 235, 0.3)',
              }}
            >
              ACTUALISER MAINTENANT
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
