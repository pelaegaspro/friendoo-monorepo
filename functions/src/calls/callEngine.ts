import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';
import { dualStateWrite, readCallState, readPresenceStatus, TERMINAL_CALL_STATES } from './callState';

const REGION = { region: 'asia-south1' as const };
const PERFORMANCE_OPTIONS = {
  region: 'asia-south1' as const,
  minInstances: 1,
  concurrency: 80,
  enforceAppCheck: false, // Leave false until Android app verifies it's sending valid tokens
};

function requireAuth(request: { auth?: { uid: string } }) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  return request.auth.uid;
}


function releaseHostPresenceTx(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  hostId: string,
  workModeOnline: boolean,
  now: admin.firestore.FieldValue
) {
  const presenceRef = db.collection('presence').doc(hostId);
  tx.set(
    presenceRef,
    {
      status: workModeOnline ? 'online' : 'offline',
      activeCallId: admin.firestore.FieldValue.delete(),
      heartbeatAt: now,
      lastSeen: now,
    },
    { merge: true }
  );

  const hostMirror = {
    isOnline: workModeOnline,
    callStatus: workModeOnline ? 'available' : 'offline',
    activeCallId: admin.firestore.FieldValue.delete(),
    updatedAt: now,
  };
  tx.set(db.collection('hosts').doc(hostId), hostMirror, { merge: true });
  tx.set(db.collection('users').doc(hostId), hostMirror, { merge: true });
}

/**
 * Server-authoritative call initiation with atomic host lock and anti-spam controls.
 */
export const initiateCall = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const callerId = requireAuth(request);
  const { hostId, callType, deviceId } = request.data as { hostId?: string; callType?: string; deviceId?: string };
  if (!hostId || typeof hostId !== 'string') {
    throw new HttpsError('invalid-argument', 'hostId is required');
  }
  if (hostId === callerId) {
    throw new HttpsError('invalid-argument', 'Cannot call yourself');
  }

  const db = getDb();

  // Call spam rate-limiting: Max 1 call per 10 seconds per caller profile
  const tenSecAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 10000);
  const recentCallsSnap = await db.collection('calls')
    .where('callerId', '==', callerId)
    .where('createdAt', '>=', tenSecAgo)
    .limit(1)
    .get();

  if (!recentCallsSnap.empty) {
    throw new HttpsError('resource-exhausted', 'Please wait at least 10 seconds between call attempts.');
  }

  // Device-level global rate-limiting (Anti-fraud fingerprint checking)
  if (deviceId) {
    const recentDeviceSnap = await db.collection('calls')
      .where('deviceId', '==', deviceId)
      .where('createdAt', '>=', tenSecAgo)
      .limit(1)
      .get();
    
    if (!recentDeviceSnap.empty) {
      throw new HttpsError('resource-exhausted', 'Please wait at least 10 seconds between call attempts from this device.');
    }
  }

  // Host-target spam detection: Max 3 call attempts to the same host within 5 minutes
  const fiveMinAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
  const recentToHostSnap = await db.collection('calls')
    .where('callerId', '==', callerId)
    .where('hostId', '==', hostId)
    .where('createdAt', '>=', fiveMinAgo)
    .get();

  if (recentToHostSnap.size >= 3) {
    throw new HttpsError('resource-exhausted', 'You have attempted too many calls to this host recently. Please wait 5 minutes.');
  }

  const type = callType === 'video' ? 'video' : 'audio';

  const result = await db.runTransaction(async (tx) => {
    const callerRef = db.collection('users').doc(callerId);
    const hostUserRef = db.collection('users').doc(hostId);
    const hostRef = db.collection('hosts').doc(hostId);
    const presenceRef = db.collection('presence').doc(hostId);

    const [callerSnap, hostUserSnap, hostSnap, presenceSnap] = await Promise.all([
      tx.get(callerRef),
      tx.get(hostUserRef),
      tx.get(hostRef),
      tx.get(presenceRef),
    ]);

    if (!callerSnap.exists) throw new HttpsError('not-found', 'Caller profile not found');
    if (!hostUserSnap.exists || hostUserSnap.data()?.isHost !== true) {
      throw new HttpsError('failed-precondition', 'Host not available');
    }
    if (!hostSnap.exists) throw new HttpsError('not-found', 'Host profile not found');

    const callerData = callerSnap.data()!;
    if (callerData.walletFrozen === true) {
      throw new HttpsError('failed-precondition', 'Wallet is frozen');
    }

    const hostData = hostSnap.data()!;
    const ratePerMinute =
      type === 'video'
        ? (typeof hostData.ratePerVideoMinute === 'number' ? hostData.ratePerVideoMinute : 10)
        : (typeof hostData.ratePerAudioMinute === 'number' ? hostData.ratePerAudioMinute : 5);

    const balance =
      typeof callerData.coinBalance === 'number'
        ? callerData.coinBalance
        : typeof callerData.coins === 'number'
          ? callerData.coins
          : 0;

    const minRequired = ratePerMinute * 2;
    if (balance < minRequired) {
      throw new HttpsError('failed-precondition', `Need at least ${minRequired} coins to start a call`);
    }

    const presenceData = presenceSnap.data() as Record<string, unknown> | undefined;
    const presenceStatus = readPresenceStatus(presenceData);
    if (presenceStatus !== 'online') {
      throw new HttpsError('failed-precondition', 'Host is offline');
    }
    if (presenceData?.activeCallId) {
      throw new HttpsError('failed-precondition', 'Host is busy');
    }

    const callRef = db.collection('calls').doc();
    const callId = callRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const stateFields = dualStateWrite('ringing');

    tx.set(callRef, {
      callerId,
      hostId,
      receiverId: hostId,
      fromUserId: callerId,
      toUserId: hostId,
      ...stateFields,
      callType: type,
      ratePerMinute,
      agoraChannel: callId,
      coinsSpent: 0,
      coinsDebited: 0,
      billingStarted: false,
      anonymous: true,
      fromDisplayName: 'User',
      toDisplayName: (hostData.alias as string) || 'Host',
      createdAt: now,
      ringingAt: now,
      deviceId: deviceId || null,
    });

    tx.set(presenceRef, {
      status: 'busy',
      activeCallId: callId,
      heartbeatAt: now,
      lastSeen: now,
    }, { merge: true });

    tx.set(hostRef, {
      callStatus: 'busy',
      isOnline: true,
      activeCallId: callId,
      updatedAt: now,
    }, { merge: true });

    return { callId, ratePerMinute, callType: type };
  });

  return result;
});

export const acceptCall = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const hostId = requireAuth(request);
  const { callId } = request.data as { callId?: string };
  if (!callId) throw new HttpsError('invalid-argument', 'callId is required');

  const db = getDb();
  await db.runTransaction(async (tx) => {
    const callRef = db.collection('calls').doc(callId);
    const callSnap = await tx.get(callRef);
    if (!callSnap.exists) throw new HttpsError('not-found', 'Call not found');

    const data = callSnap.data()!;
    const state = readCallState(data as Record<string, unknown>);
    if (state !== 'ringing') {
      throw new HttpsError('failed-precondition', `Call is ${state}, not ringing`);
    }
    const callHostId = (data.hostId as string) || (data.receiverId as string);
    if (callHostId !== hostId) {
      throw new HttpsError('permission-denied', 'Not the host for this call');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(callRef, {
      ...dualStateWrite('accepted'),
      acceptedAt: now,
    });
  });

  return { callId, state: 'accepted' };
});

export const rejectCall = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { callId, reason } = request.data as { callId?: string; reason?: string };
  if (!callId) throw new HttpsError('invalid-argument', 'callId is required');

  const db = getDb();
  await db.runTransaction(async (tx) => {
    const callRef = db.collection('calls').doc(callId);
    const callSnap = await tx.get(callRef);
    if (!callSnap.exists) throw new HttpsError('not-found', 'Call not found');

    const data = callSnap.data()!;
    const state = readCallState(data as Record<string, unknown>);
    if (TERMINAL_CALL_STATES.includes(state) || data.terminalStateProcessed === true) {
      return; // Already processed
    }

    const hostId = (data.hostId as string) || (data.receiverId as string) || '';
    const callerId = (data.callerId as string) || (data.fromUserId as string) || '';
    if (uid !== hostId && uid !== callerId) {
      throw new HttpsError('permission-denied', 'Not a participant');
    }

    const endState = reason === 'ring_timeout' ? 'missed' : 'rejected';
    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(callRef, {
      ...dualStateWrite(endState),
      endedAt: now,
      endReason: reason || 'host_declined',
      terminalStateProcessed: true,
    });

    if (hostId) {
      releaseHostPresenceTx(tx, db, hostId, true, now);
    }
  });

  return { callId, state: 'rejected' };
});

export const markCallConnecting = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { callId } = request.data as { callId?: string };
  if (!callId) throw new HttpsError('invalid-argument', 'callId is required');

  const db = getDb();
  await db.runTransaction(async (tx) => {
    const callRef = db.collection('calls').doc(callId);
    const snap = await tx.get(callRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Call not found');

    const data = snap.data()!;
    const callerId = (data.callerId as string) || (data.fromUserId as string);
    const hostId = (data.hostId as string) || (data.receiverId as string);
    if (uid !== callerId && uid !== hostId) {
      throw new HttpsError('permission-denied', 'Not a participant');
    }

    const state = readCallState(data as Record<string, unknown>);
    if (!['accepted', 'connecting', 'ringing'].includes(state)) {
      throw new HttpsError('failed-precondition', `Invalid state ${state} for connecting`);
    }

    tx.update(callRef, {
      ...dualStateWrite('connecting'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { callId, state: 'connecting' };
});

export const markCallActive = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { callId } = request.data as { callId?: string };
  if (!callId) throw new HttpsError('invalid-argument', 'callId is required');

  const db = getDb();
  await db.runTransaction(async (tx) => {
    const callRef = db.collection('calls').doc(callId);
    const snap = await tx.get(callRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Call not found');

    const data = snap.data()!;
    const callerId = (data.callerId as string) || (data.fromUserId as string);
    const hostId = (data.hostId as string) || (data.receiverId as string);
    if (uid !== callerId && uid !== hostId) {
      throw new HttpsError('permission-denied', 'Not a participant');
    }

    const state = readCallState(data as Record<string, unknown>);
    if (TERMINAL_CALL_STATES.includes(state)) {
      throw new HttpsError('failed-precondition', 'Call already ended');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(callRef, {
      ...dualStateWrite('active'),
      billingStarted: true,
      startedAt: data.startedAt || now,
      acceptedAt: data.acceptedAt || now,
    });
  });

  return { callId, state: 'active' };
});

export const endCall = onCall(PERFORMANCE_OPTIONS, async (request) => {
  const uid = requireAuth(request);
  const { callId, reason } = request.data as { callId?: string; reason?: string };
  if (!callId) throw new HttpsError('invalid-argument', 'callId is required');

  const db = getDb();
  await db.runTransaction(async (tx) => {
    const callRef = db.collection('calls').doc(callId);
    const callSnap = await tx.get(callRef);
    if (!callSnap.exists) return;

    const data = callSnap.data()!;
    const state = readCallState(data as Record<string, unknown>);
    if (TERMINAL_CALL_STATES.includes(state) || data.terminalStateProcessed === true) {
      return; // Already processed
    }

    const hostId = (data.hostId as string) || (data.receiverId as string) || '';
    const callerId = (data.callerId as string) || (data.fromUserId as string) || '';
    if (uid !== hostId && uid !== callerId) {
      throw new HttpsError('permission-denied', 'Not a participant');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(callRef, {
      ...dualStateWrite('ended'),
      endReason: reason || 'user_hangup',
      endedAt: now,
      updatedAt: now,
      terminalStateProcessed: true,
    });

    if (hostId) {
      releaseHostPresenceTx(tx, db, hostId, true, now);
    }
  });

  return { callId, state: 'ended' };
});
