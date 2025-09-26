"use client";

import { FdCalculator } from '@/components/fd-calculator';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const FdCalculatorClient = dynamic(
  () =>
    import('@/components/fd-calculator').then((mod) => mod.FdCalculator),
  { ssr: false }
);


export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Suspense fallback={<div className="w-full max-w-md space-y-8">
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>}>
          <FdCalculatorClient />
        </Suspense>
      </div>
    </main>
  );
}
