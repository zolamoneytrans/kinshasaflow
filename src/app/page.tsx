'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const WelcomePageWithNoSSR = dynamic(() => import('@/components/welcome-page'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
      <Skeleton className="h-10 w-48 mb-12" />
      <Skeleton className="h-16 w-3/4 max-w-2xl mb-6" />
      <Skeleton className="h-6 w-full max-w-xl mb-10" />
      <Skeleton className="h-14 w-56" />
    </div>
  ),
});

export default function Home() {
  return <WelcomePageWithNoSSR />;
}
