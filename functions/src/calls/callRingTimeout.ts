import { onSchedule } from 'firebase-functions/v2/scheduler';
import { admin, getDb } from '../firebaseAdmin';
import { readCallState } from './callState';

const RING_TIMEOUT_MS = 45_000;

export const callRingTimeout = onSchedule(
  { schedule: 'every 1 minutes', region: 'asia-south1', timeZone: 'Asia/Kolkata' },
  async () => {
    const db = getDb();
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - RING_TIMEOUT_MS);

    const snap = await db
      .collection('calls')
      .where('state', '==', 'ringing')
      .limit(100)
      .get();

    let cleared = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const state = readCallState(data as Record<string, unknown>);
      if (state !== 'ringing') continue;

      const ringingAt = data.ringingAt as admin.firestore.Timestamp | undefined;
      const createdAt = data.createdAt as admin.firestore.Timestamp | undefined;
      const ts = ringingAt || createdAt;
      if (!ts || ts.toMillis() > cutoff.toMillis()) continue;

      const hostId = (data.hostId as string) || (data.receiverId as string) || '';
      
      const didClear = await db.runTransaction(async (tx) => {
        const freshSnap = await tx.get(doc.ref);
        if (!freshSnap.exists) return false;
        const freshData = freshSnap.data()!;
        if (readCallState(freshData) !== 'ringing') return false;

        const now = admin.firestore.FieldValue.serverTimestamp();
        tx.update(doc.ref, {
          state: 'missed',
          status: 'missed',
          endedAt: now,
          endReason: 'ring_timeout',
        });

        if (hostId) {
          tx.set(db.collection('presence').doc(hostId), {
            status: 'online',
            activeCallId: admin.firestore.FieldValue.delete(),
            lastSeen: now,
          }, { merge: true });

          const hostMirror = {
            isOnline: true,
            callStatus: 'available',
            activeCallId: admin.firestore.FieldValue.delete(),
            updatedAt: now,
          };
          tx.set(db.collection('hosts').doc(hostId), hostMirror, { merge: true });
          tx.set(db.collection('users').doc(hostId), hostMirror, { merge: true });
        }
        return true;
      });

      if (didClear) {
        cleared++;
      }
    }

    if (cleared > 0) console.log({ msg: 'callRingTimeout', cleared });
  }
);
