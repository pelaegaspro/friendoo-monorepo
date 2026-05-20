'use client';

import type { CoinTransaction } from '../../src/types/wallet';
import { Card } from '../../src/components/ui/card';
import { ScrollArea } from '../../src/components/ui/scroll-area';
import { ArrowDownLeft, ArrowUpRight, BadgePercent } from 'lucide-react';

function formatTime(ts: unknown) {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }
  if (typeof ts === 'string') return ts;
  return '';
}

function rowMeta(tx: CoinTransaction) {
  switch (tx.type) {
    case 'topup':
      return { icon: ArrowUpRight, label: 'Top up', color: 'text-emerald-500' };
    case 'call_debit':
      return { icon: ArrowDownLeft, label: 'Call', color: 'text-red-500' };
    case 'bonus':
      return { icon: BadgePercent, label: 'Bonus', color: 'text-yellow-500' };
    default:
      return { icon: ArrowUpRight, label: tx.type, color: 'text-muted-foreground' };
  }
}

export function TransactionHistory({
  transactions,
  loading,
  emptyMessage,
}: {
  transactions: CoinTransaction[];
  loading: boolean;
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Recent activity</h2>
      <Card className="rounded-2xl">
        <ScrollArea className="h-[320px]">
          <div className="p-3 space-y-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl border bg-card animate-pulse" />
              ))
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              transactions.map((tx) => {
                const meta = rowMeta(tx);
                const Icon = meta.icon;
                const amount = tx.amountCoins;
                const sign = typeof amount === 'number' && amount > 0 ? '+' : '';
                const displayAmount = typeof amount === 'number' ? amount : 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold tabular-nums ${displayAmount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {sign}
                      {displayAmount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </section>
  );
}

