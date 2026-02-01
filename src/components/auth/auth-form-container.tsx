'use client';

export function AuthFormContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
