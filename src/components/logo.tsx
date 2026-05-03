'use client';

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 162 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <path
        d="M16 2C12.13 2 9 5.13 9 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        fill="currentColor"
      />
      <text
        x="36"
        y="23"
        fontFamily="Inter, sans-serif"
        fontSize="18"
        fontWeight="bold"
        fill="currentColor"
      >
        Kinshasa Flow
      </text>
    </svg>
  );
}