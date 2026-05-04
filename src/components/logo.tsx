'use client';

import { cn } from "@/lib/utils";

/**
 * Logo officiel de Kinshasa Flow utilisant le marqueur de position bleu.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto text-primary"
        >
          {/* Forme du Pin / Marqueur de position */}
          <path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
            fill="currentColor"
          />
          {/* Cercle intérieur blanc */}
          <circle cx="12" cy="9" r="3" fill="white" />
        </svg>
        <span className="font-black tracking-tighter text-xl">Kinshasa Flow</span>
    </div>
  );
}
