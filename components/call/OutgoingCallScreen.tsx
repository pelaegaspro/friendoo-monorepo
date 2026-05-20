'use client';

import { useMemo } from 'react';
import { useCall } from '../../hooks/useCall';
import { useWallet } from '../../hooks/useWallet';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import { Button } from '../../src/components/ui/button';

export function OutgoingCallScreen({ callId, onExit }: { callId: string; onExit: () => void }) {
  const { call, loading, cancel } = useCall(callId);
  const wallet = useWallet();

  const ratePerMinute = call?.ratePerMinute ?? 5;
  const minutesRemaining = useMemo(() => Math.floor(wallet.coinBalance / ratePerMinute), [wallet.coinBalance, ratePerMinute]);

  if (loading) {
    return (
      <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="h-24 rounded-2xl border bg-card animate-pulse" />
          <div className="h-64 rounded-2xl border bg-card animate-pulse" />
        </div>
      </main>
    );
  }

  if (!call) {
    return (
      <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border bg-card p-4 text-center">
          <div className="text-sm text-muted-foreground">Call not found.</div>
          <Button className="mt-3 w-full rounded-xl" onClick={onExit}>
            Back
          </Button>
        </div>
      </main>
    );
  }

  const calleeName = call.anonymous ? 'Anonymous' : call.toDisplayName ?? 'Friendoo user';
  const fallback = calleeName.slice(0, 1).toUpperCase();

  return (
    <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-lg font-semibold tabular-nums">{wallet.coinBalance} coins</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Est. minutes</div>
            <div className="text-lg font-semibold tabular-nums">{minutesRemaining}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-center space-y-4">
          <div className="mx-auto relative w-fit">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <DiceBearAvatar seed={call.toUserId || calleeName} size={96} className="relative" />
          </div>

          <div>
            <div className="text-lg font-semibold">{calleeName}</div>
            <div className="text-sm text-muted-foreground">Calling...</div>
          </div>

          <Button variant="destructive" className="w-full rounded-xl" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
    </main>
  );
}

