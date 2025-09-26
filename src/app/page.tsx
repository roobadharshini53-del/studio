import { FdCalculator } from '@/components/fd-calculator';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <FdCalculator />
      </div>
    </main>
  );
}
