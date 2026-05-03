'use client';

import React from 'react';

/**
 * Conteneur pour les formulaires d'authentification.
 * Assure que le contenu est défilable sur mobile et centré sur bureau.
 */
export function AuthFormContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-start md:justify-center p-4 md:p-8 bg-slate-50/30">
            <div className="w-full max-w-md py-6 md:py-12">
                {children}
            </div>
        </div>
    );
}
