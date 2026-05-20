'use client';

import { Coins } from 'lucide-react';

export function CoinBalance({ balance, loading }: { balance: number; loading?: boolean }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Your balance</div>
          <div className="text-3xl font-semibold tabular-nums">
            {loading ? <span className="inline-block h-9 w-24 rounded bg-muted animate-pulse" /> : balance}
          </div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Coins className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

