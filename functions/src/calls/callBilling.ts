import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { admin, getDb } from '../firebaseAdmin';
import { CallState, TERMINAL_CALL_STATES, readCallState } from './callState';

type CallDoc = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: CallState;
  callType?: string; // 'audio' | 'video'
  agoraChannel: string;
  agoraToken?: string;
  ratePerMinute: number;
  coinsSpent: number;
  anonymous: boolean;
  aiAvatarId?: string;
  fromDisplayName?: string;
  toDisplayName?: string;
  toFcmTokens?: string[];
  createdAt?: unknown;
  acceptedAt?: unknown;
  endedAt?: unknown;
  endReason?: unknown;
  lastBilledAt?: unknown;
  ringingAt?: unknown;
};

type BillingJobStatus = 'running' | 'stopped' | 'error';

type ActiveBillingJobDoc = {
  callId: string;
  callerId: string;
  receiverId: string;
  callType?: string; // 'audio' | 'video'
  ratePerMinute: number;
  startedAt: admin.firestore.FieldValue;
  nextBillAt: admin.firestore.Timestamp;
  status: BillingJobStatus;
  totalDeducted: number;
  durationSeconds: number;
  lastError?: { message: string; at: admin.firestore.FieldValue };
};

function toCall(data: admin.firestore.DocumentData | undefined): CallDoc | null {
  if (!data) return null;
  const fromUserId = typeof data.fromUserId === 'string' ? data.fromUserId : null;
  const toUserId = typeof data.toUserId === 'string' ? data.toUserId : null;
  const status = readCallState(data as Record<string, unknown>);
  const ratePerMinute = typeof data.ratePerMinute === 'number' ? data.ratePerMinute : null;
  if (!fromUserId || !toUserId || !status || !ratePerMinute) return null;
  return {
    id: typeof data.id === 'string' ? data.id : '',
    fromUserId,
    toUserId,
    status,
    callType: typeof data.callType === 'string' ? data.callType : 'audio',
    agoraChannel: typeof data.agoraChannel === 'string' ? data.agoraChannel : '',
    agoraToken: typeof data.agoraToken === 'string' ? data.agoraToken : undefined,
    ratePerMinute,
    coinsSpent: typeof data.coinsSpent === 'number' ? data.coinsSpent : 0,
    anonymous: Boolean(data.anonymous),
    aiAvatarId: typeof data.aiAvatarId === 'string' ? data.aiAvatarId : undefined,
    fromDisplayName: typeof data.fromDisplayName === 'string' ? data.fromDisplayName : undefined,
    toDisplayName: typeof data.toDisplayName === 'string' ? data.toDisplayName : undefined,
    toFcmTokens: Array.isArray(data.toFcmTokens) ? (data.toFcmTokens.filter((t: unknown) => typeof t === 'string') as string[]) : undefined,
    createdAt: data.createdAt,
    acceptedAt: data.acceptedAt,
    endedAt: data.endedAt,
    endReason: data.endReason,
    lastBilledAt: data.lastBilledAt,
    ringingAt: data.ringingAt,
  };
}

function isTerminalStatus(status: CallState) {
  return TERMINAL_CALL_STATES.includes(status);
}

export const callBillingTrigger = onDocumentUpdated(
  { document: 'calls/{callId}', region: 'asia-south1' },
  async (event) => {
    const callId = event.params.callId as string;
    const beforeCall = toCall(event.data?.before.data());
    const afterCall = toCall(event.data?.after.data());

    if (!afterCall || !beforeCall) {
      console.warn({
        msg: 'callBillingTrigger missing before/after call data',
        callId,
      });
      return;
    }

    if (beforeCall.status === afterCall.status) return;

    const db = getDb();
    const jobRef = db.collection('activeBillingJobs').doc(callId);

    if (afterCall.status === 'active') {
      try {
        const existing = await jobRef.get();
        if (existing.exists) return;

        const now = admin.firestore.Timestamp.now();
        const nextBillAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 60_000);

        const job: Omit<ActiveBillingJobDoc, 'startedAt'> & { startedAt: admin.firestore.FieldValue } = {
          callId,
          callerId: afterCall.fromUserId,
          receiverId: afterCall.toUserId,
          callType: afterCall.callType,
          ratePerMinute: afterCall.ratePerMinute,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          nextBillAt,
          status: 'running',
          totalDeducted: 0,
          durationSeconds: 0,
        };

        await jobRef.create(job);

        const { enqueueBillingTick } = await import('./billingScheduler');
        await enqueueBillingTick({
          callId,
          scheduleTime: nextBillAt,
        });
      } catch (e) {
        console.error({
          msg: 'callBillingTrigger failed to start billing job',
          callId,
          error: e,
        });
        await jobRef.set(
          {
            callId,
            callerId: afterCall.fromUserId,
            receiverId: afterCall.toUserId,
            callType: afterCall.callType,
            ratePerMinute: afterCall.ratePerMinute,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            nextBillAt: admin.firestore.Timestamp.now(),
            status: 'error',
            totalDeducted: 0,
            durationSeconds: 0,
            lastError: { message: e instanceof Error ? e.message : 'unknown', at: admin.firestore.FieldValue.serverTimestamp() },
          },
          { merge: true }
        );
      }
      return;
    }

    if (isTerminalStatus(afterCall.status)) {
      try {
        const jobSnap = await jobRef.get();
        const jobData = jobSnap.exists
          ? (jobSnap.data() as {
              durationSeconds?: number;
              totalDeducted?: number;
              ratePerMinute?: number;
              callerId?: string;
              receiverId?: string;
              callType?: string;
            } | undefined)
          : undefined;
        const durationSeconds = typeof jobData?.durationSeconds === 'number' ? jobData.durationSeconds : 0;
        const totalDeducted = typeof jobData?.totalDeducted === 'number' ? jobData.totalDeducted : 0;
        const remainingSeconds = 0;
        const remainingCoins = 0;

        let additionalDebited = 0;
        if (remainingCoins > 0) {
          const callRef = db.collection('calls').doc(callId);
          const callerId = jobData?.callerId || afterCall.fromUserId;
          const receiverId = jobData?.receiverId || afterCall.toUserId;
          if (callerId && receiverId) {
            await db.runTransaction(async (t) => {
              const callerRef = db.collection('users').doc(callerId);
              const receiverRef = db.collection('users').doc(receiverId);
              const callerSnap = await t.get(callerRef);
              const callerBalance =
                callerSnap.exists && typeof callerSnap.data()?.coinBalance === 'number'
                  ? (callerSnap.data()!.coinBalance as number)
                  : 0;
              const debitCoins = Math.min(remainingCoins, Math.max(0, Math.floor(callerBalance)));
              if (debitCoins <= 0) return;

              const configRef = db.collection('config').doc('appSettings');
              const configSnap = await t.get(configRef);
              const shareRaw = configSnap.exists ? configSnap.data()?.hostRevenueShare : undefined;
              const share = typeof shareRaw === 'number' ? shareRaw : 0.7;
              const hostCoins = Math.floor(debitCoins * share);
              const now = admin.firestore.FieldValue.serverTimestamp();

              t.set(
                callerRef,
                {
                  coinBalance: admin.firestore.FieldValue.increment(-debitCoins),
                  totalCoinsSpent: admin.firestore.FieldValue.increment(debitCoins),
                  updatedAt: now,
                },
                { merge: true }
              );

              t.set(
                receiverRef,
                {
                  coinBalance: admin.firestore.FieldValue.increment(hostCoins),
                  totalCoinsEarned: admin.firestore.FieldValue.increment(hostCoins),
                  updatedAt: now,
                },
                { merge: true }
              );

              const callerTxRef = db.collection('coinTransactions').doc();
              t.set(callerTxRef, {
                userId: callerId,
                type: 'calldebit',
                callType: jobData?.callType || afterCall.callType || 'audio',
                amountCoins: -debitCoins,
                callId,
                status: 'success',
                createdAt: now,
              });

              const hostTxRef = db.collection('coinTransactions').doc();
              t.set(hostTxRef, {
                userId: receiverId,
                type: 'hostearning',
                callType: jobData?.callType || afterCall.callType || 'audio',
                amountCoins: hostCoins,
                callId,
                callerId,
                finalDurationSeconds: remainingSeconds,
                status: 'success',
                createdAt: now,
              });

              t.set(
                callRef,
                {
                  coinsSpent: admin.firestore.FieldValue.increment(debitCoins),
                },
                { merge: true }
              );

              additionalDebited = debitCoins;
            });
          }
        }

        await jobRef.set(
          {
            status: 'stopped',
            stoppedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        await db
          .collection('calls')
          .doc(callId)
          .set(
            {
              endedAt: admin.firestore.FieldValue.serverTimestamp(),
              finalDurationSeconds: durationSeconds + remainingSeconds,
              finalCoinsDeducted: totalDeducted + additionalDebited,
            },
            { merge: true }
          );
      } catch (e) {
        console.error({
          msg: 'callBillingTrigger failed to stop billing job',
          callId,
          error: e,
        });
      }
    }
  }
);

