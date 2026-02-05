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
        d="M16 3.5C10.201 3.5 5.5 8.201 5.5 14C5.5 21.333 16 31.5 16 31.5S26.5 21.333 26.5 14C26.5 8.201 21.799 3.5 16 3.5ZM16 17.5C14.067 17.5 12.5 15.933 12.5 14C12.5 12.067 14.067 10.5 16 10.5C17.933 10.5 19.5 12.067 19.5 14C19.5 15.933 17.933 17.5 16 17.5Z"
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
