import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';
import { readPresenceStatus } from '../calls/callState';

const REGION = { region: 'asia-south1' as const };

/**
 * Client heartbeat — only way to set presence online (except initiateCall busy lock).
 */
export const presenceHeartbeat = onCall(REGION, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Login required');
  }
  const uid = request.auth.uid;
  const { deviceId, workModeOnline } = request.data as {
    deviceId?: string;
    workModeOnline?: boolean;
  };

  const db = getDb();
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const isHost = userSnap.data()?.isHost === true;
  const presenceRef = db.collection('presence').doc(uid);
  const presenceSnap = await presenceRef.get();
  const current = presenceSnap.data() as Record<string, unknown> | undefined;
  const currentStatus = readPresenceStatus(current);

  if (currentStatus === 'busy' && current?.activeCallId) {
    await presenceRef.set(
      {
        heartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        deviceId: deviceId || current?.deviceId || null,
      },
      { merge: true }
    );
    return { status: 'busy', activeCallId: current.activeCallId };
  }

  const wantsOnline = workModeOnline === true && isHost;
  const status = wantsOnline ? 'online' : 'offline';
  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(
    presenceRef,
    {
      status,
      role: isHost ? 'host' : 'user',
      heartbeatAt: now,
      lastSeen: now,
      deviceId: deviceId || null,
      activeCallId: admin.firestore.FieldValue.delete(),
    },
    { merge: true }
  );

  if (isHost) {
    const mirror = {
      isOnline: wantsOnline,
      callStatus: wantsOnline ? 'available' : 'offline',
      updatedAt: now,
    };
    batch.set(db.collection('hosts').doc(uid), mirror, { merge: true });
    batch.set(db.collection('users').doc(uid), { ...mirror, lastActive: now }, { merge: true });
  } else {
    batch.set(db.collection('users').doc(uid), { lastActive: now }, { merge: true });
  }

  await batch.commit();

  return { status, isHost };
});
