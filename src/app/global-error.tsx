'use client';

import { useEffect } from 'react';

/**
 * Gestionnaire d'erreurs global robuste pour Next.js.
 * Capable de forcer un rechargement propre en cas d'échec de chargement des ressources.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Si c'est une erreur liée aux fichiers statiques (Chunks) ou un timeout
    const msg = error.message || "";
    if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.includes('timeout')) {
      console.warn("K-Flow Error Boundary: Tentative de récupération automatique...");
      
      // Enregistrement de la tentative pour éviter les boucles
      const lastRetry = sessionStorage.getItem('kflow-last-retry-v4');
      const now = Date.now();
      
      if (!lastRetry || (now - parseInt(lastRetry)) > 15000) {
        sessionStorage.setItem('kflow-last-retry-v4', now.toString());
        
        // Nettoyage radical du cache pour débloquer l'application
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
              registration.unregister();
            }
            
            // Nettoyage des caches storage
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
          backgroundColor: '#f8fafc',
          color: '#0f172a'
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
                // Nettoyage des Service Workers avant rechargement manuel
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    regs.forEach(r => r.unregister());
                    window.location.href = window.location.origin + '?v=' + Date.now();
                  });
                } else {
                  window.location.href = window.location.origin + '?v=' + Date.now();
                }
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
                transition: 'transform 0.2s'
              }}
            >
              ACTUALISER MAINTENANT
            </button>
            <p style={{ marginTop: '20px', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Code d'erreur: {error.digest || 'RESOURCE_TIMEOUT'}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
