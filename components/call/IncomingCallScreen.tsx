'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { callService } from '../../services/callService';
import { useCall } from '../../hooks/useCall';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import { Button } from '../../src/components/ui/button';

export function IncomingCallScreen({ callId, onExit }: { callId: string; onExit: () => void }) {
  const router = useRouter();
  const { call, loading } = useCall(callId);

  useEffect(() => {
    if (!call) return;
    if (call.status === 'missed') {
      toast.error('Call cancelled');
      router.replace('/');
    }
  }, [call, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background text-foreground px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md h-72 rounded-2xl border bg-card animate-pulse" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background text-foreground px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border bg-card p-4 text-center">
          <div className="text-sm text-muted-foreground">Call not found.</div>
          <Button className="mt-3 w-full rounded-xl" onClick={onExit}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const callerName = call.anonymous ? 'Anonymous' : call.fromDisplayName ?? 'Friendoo user';
  const fallback = callerName.slice(0, 1).toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] bg-background text-foreground px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center space-y-5">
        <div className="mx-auto relative w-fit">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <DiceBearAvatar seed={call.fromUserId || callerName} size={96} className="relative" />
        </div>

        <div>
          <div className="text-lg font-semibold">{callerName}</div>
          <div className="text-sm text-muted-foreground">Incoming call...</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-600/90"
            onClick={async () => {
              await callService.acceptCall(callId);
              router.replace(`/call/active/${callId}`);
            }}
          >
            Accept
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={async () => {
              await callService.declineCall(callId);
              router.replace('/');
            }}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

