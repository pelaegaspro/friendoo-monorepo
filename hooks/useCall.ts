import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { CallDoc } from '../src/types/calls';
import { callService } from '../services/callService';

type UseCallState = {
  call: CallDoc | null;
  loading: boolean;
  error: string | null;
  cancel: () => Promise<void>;
};

export function useCall(callId: string): UseCallState {
  const router = useRouter();
  const [call, setCall] = useState<CallDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = callService.subscribeToCall(callId, (c) => {
      setCall(c);
      setLoading(false);
      if (!c) return;

      if (c.status === 'active') {
        router.replace(`/call/active/${callId}`);
      }

      if (c.status === 'rejected' || c.status === 'missed') {
        toast.error('Call not answered');
        router.replace('/');
      }
    });

    return () => unsub();
  }, [callId, router]);

  useEffect(() => {
    // ringing timeout: 30 seconds
    if (!call || call.status !== 'ringing') return;
    if (timeoutRef.current) return;

    timeoutRef.current = window.setTimeout(async () => {
      try {
        // Mark call as missed if still ringing
        await callService.markMissed(callId);
      } catch (e) {
        console.error('call ringing timeout update failed', e);
      }
    }, 30_000);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [call, callId]);

  const cancel = useCallback(async () => {
    try {
      await callService.declineCall(callId);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel call');
    }
  }, [callId, router]);

  return useMemo(
    () => ({
      call,
      loading,
      error,
      cancel,
    }),
    [call, loading, error, cancel]
  );
}

