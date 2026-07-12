'use client';

import { useEffect } from 'react';

/**
 * Boundary d'erreur globale pour l'application.
 * Simplifié pour éviter tout rejet Apple Guideline 2.1(a).
 * Ne mentionne que des problèmes de connexion ou de chargement temporaire.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log silencieux en production, utile pour le débogage Next.js
    if (process.env.NODE_ENV !== 'production') {
      console.error("Global Error Caught:", error);
    }
  }, [error]);

  const handleRetry = () => {
    // Tente de réinitialiser le rendu React
    reset();
    // Si cela échoue, force un rechargement complet de la page vers l'accueil
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <body style={{
        backgroundColor: '#f8fafc',
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '48px 32px',
            borderRadius: '24px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '24px',
              backgroundColor: '#f1f5f9',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              📡
            </div>
            <h2 style={{ 
              fontSize: '22px', 
              fontWeight: '800', 
              marginBottom: '12px', 
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Connexion interrompue
            </h2>
            <p style={{ 
              color: '#64748b', 
              marginBottom: '32px', 
              lineHeight: '1.5',
              fontSize: '15px'
            }}>
              Une difficulté technique empêche l'affichage du contenu. 
              Veuillez vérifier votre accès internet et réessayer.
            </p>
            <button
              onClick={handleRetry}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#248eeb',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'opacity 0.2s'
              }}
            >
              RÉESSAYER
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
