import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="p-8 flex justify-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-purple-600">FRIENDOO</h1>
      </header>
      <main className="flex-1 flex flex-col w-full max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
