'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../src/components/ui/button';
import { Card } from '../../src/components/ui/card';
import { callService } from '../../services/callService';

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type CallSummary = {
  endReason?: string;
  finalDurationSeconds?: number;
  finalCoinsDeducted?: number;
};

export function CallEndedScreen({ callId, onHome }: { callId: string; onHome: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CallSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const call = await callService.getCallDoc(callId);
        const data: CallSummary = {
          endReason: call.endReason,
          finalDurationSeconds: (call as unknown as { finalDurationSeconds?: unknown }).finalDurationSeconds as number | undefined,
          finalCoinsDeducted: (call as unknown as { finalCoinsDeducted?: unknown }).finalCoinsDeducted as number | undefined,
        };
        if (mounted) setSummary(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load call summary');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [callId]);

  const duration = summary?.finalDurationSeconds ?? 0;
  const coins = summary?.finalCoinsDeducted ?? 0;
  const insufficient = summary?.endReason === 'insufficientbalance' || summary?.endReason === 'insufficient_balance';

  const title = useMemo(() => {
    if (insufficient) return 'Call ended (low balance)';
    return 'Call ended';
  }, [insufficient]);

  if (loading) {
    return (
      <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md h-80 rounded-2xl border bg-card animate-pulse" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <Card className="w-full max-w-md rounded-2xl p-4 text-center space-y-3">
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button className="w-full rounded-xl" onClick={onHome}>
            Back to Home
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-2xl p-6 text-center space-y-4">
          <div className="text-xl font-semibold">{title}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-3">
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="text-lg font-semibold tabular-nums">{formatTimer(duration)}</div>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <div className="text-xs text-muted-foreground">Coins spent</div>
              <div className="text-lg font-semibold tabular-nums">{coins}</div>
            </div>
          </div>

          {insufficient ? (
            <Button className="w-full rounded-xl" onClick={() => (window.location.href = '/wallet')}>
              Top Up
            </Button>
          ) : null}
          <Button variant="secondary" className="w-full rounded-xl" onClick={onHome}>
            Back to Home
          </Button>
        </Card>
      </div>
    </main>
  );
}

