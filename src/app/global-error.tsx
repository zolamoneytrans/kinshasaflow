'use client';

import { useEffect } from 'react';

/**
 * Boundary d'erreur globale pour l'application.
 * Ce composant s'affiche en cas d'erreur fatale (ex: ChunkLoadError lors d'une mise à jour).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de l'erreur pour le diagnostic
    console.error("K-Flow Critical Error:", error);
  }, [error]);

  const handleHardReload = () => {
    // Force un rechargement complet du document depuis le serveur
    // pour s'assurer que les nouveaux fichiers JS sont récupérés.
    if (typeof window !== 'undefined') {
      // On supprime les drapeaux de récupération pour repartir sur une base saine
      sessionStorage.removeItem("kflow-recovery-v6");
      window.location.reload();
    }
  };

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
              Une nouvelle version de Kinshasa Flow est disponible ou votre connexion est instable. 
              Veuillez actualiser pour continuer.
            </p>
            <button
              onClick={handleHardReload}
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
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
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
