'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
import { callService } from '../../services/callService';
import { walletService } from '../../services/walletService';
import { useAgoraCall } from '../../hooks/useAgoraCall';
import { useCall } from '../../hooks/useCall';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useCallStore } from '../../store/callStore';

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ActiveCallScreen({ callId, onExit }: { callId: string; onExit: () => void }) {
  const router = useRouter();
  const { call, loading } = useCall(callId);
  const store = useCallStore();
  const [seconds, setSeconds] = useState(0);

  const userId = walletService.getCurrentUserId();

  useEffect(() => {
    if (!userId) return;
    const unsub = walletService.subscribeCoinBalance(userId, (b) => store.updateCoinBalance(b));
    return () => unsub();
  }, [store, userId]);

  useEffect(() => {
    if (!call) return;
    if (call.status === 'ended') {
      toast.error('Call ended — insufficient balance');
      router.replace(`/call/ended/${callId}`);
    }
  }, [call, callId, router]);

  useEffect(() => {
    if (!call || call.status !== 'active') return;
    const i = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [call]);

  const agoraHook = useAgoraCall({ callId, firebaseUid: userId ?? '' });

  const ratePerMinute = call?.ratePerMinute ?? 5;
  const estMinutes = useMemo(() => Math.floor(store.coinBalance / ratePerMinute), [ratePerMinute, store.coinBalance]);
  const lowBalance = store.coinBalance < ratePerMinute * 2;

  if (loading) {
    return (
      <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
        <div className="w-full max-w-md h-96 rounded-2xl border bg-card animate-pulse" />
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

  const peerName = call.anonymous ? 'Anonymous' : call.toDisplayName ?? call.fromDisplayName ?? 'Friendoo user';
  const fallback = peerName.slice(0, 1).toUpperCase();

  return (
    <main className="min-h-dvh px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {lowBalance ? (
          <div className="rounded-2xl border bg-yellow-500/10 text-yellow-400 px-4 py-3 text-sm">
            Low balance — top up to continue
          </div>
        ) : null}

        <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-lg font-semibold tabular-nums">{store.coinBalance} coins</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Est. minutes</div>
            <div className="text-lg font-semibold tabular-nums">{estMinutes}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-center space-y-4">
          <DiceBearAvatar seed={peerId || peerName} size={96} className="mx-auto" />

          <div className="space-y-1">
            <div className="text-lg font-semibold">{peerName}</div>
            <div className="text-sm text-muted-foreground tabular-nums">{formatTimer(seconds)}</div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {agoraHook.joining ? <Badge variant="secondary">Connecting audio…</Badge> : null}
            {agoraHook.error ? <Badge variant="destructive">Audio error</Badge> : null}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={async () => {
                store.toggleMute();
                await agoraHook.setMute(!store.isMuted);
              }}
            >
              {store.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={async () => {
                store.toggleSpeaker();
                await agoraHook.setSpeakerOn(!store.isSpeakerOn);
              }}
            >
              {store.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={async () => {
                try {
                  await callService.endCall(callId);
                } finally {
                  await agoraHook.leave();
                  router.replace(`/call/ended/${callId}`);
                }
              }}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

