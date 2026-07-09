'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("K-Flow Error Boundary:", error);
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌐</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.025em' }}>Problème de connexion</h2>
            <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6', fontWeight: '500' }}>
              Nous n'avons pas pu charger les ressources nécessaires. Cela peut arriver si la connexion est instable.
            </p>
            <button
              onClick={() => {
                reset();
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
              RÉESSAYER
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
