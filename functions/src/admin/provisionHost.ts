import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';

const REGION = { region: 'asia-south1' as const };

async function assertAdmin(uid: string) {
  const snap = await getDb().collection('admins').doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }
}

/**
 * Admin-only: promote a user to host and create hosts/{uid} discovery profile.
 */
export const provisionHost = onCall(REGION, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Login required');
  await assertAdmin(request.auth.uid);

  const {
    uid,
    displayName,
    primaryLanguage = 'en',
    ratePerAudioMinute = 5,
    ratePerVideoMinute = 10,
    supportsVideo = false,
    bio = '',
  } = request.data as {
    uid?: string;
    displayName?: string;
    primaryLanguage?: string;
    ratePerAudioMinute?: number;
    ratePerVideoMinute?: number;
    supportsVideo?: boolean;
    bio?: string;
  };

  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid is required');
  }

  const db = getDb();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(uid);
    const hostRef = db.collection('hosts').doc(uid);
    const presenceRef = db.collection('presence').doc(uid);

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    tx.set(
      userRef,
      {
        isHost: true,
        role: 'host',
        accountType: 'host',
        gender: 'female',
        updatedAt: now,
      },
      { merge: true }
    );

    tx.set(
      hostRef,
      {
        uid,
        alias: displayName || userSnap.data()?.displayName || 'Host',
        bio,
        primaryLanguage,
        languages: [primaryLanguage],
        ratePerAudioMinute,
        ratePerVideoMinute,
        supportsVideo,
        discoverable: true,
        isApproved: true,
        approvedAt: now,
        avgRating: 5,
        ratingCount: 0,
        totalCalls: 0,
        isOnline: false,
        callStatus: 'offline',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    tx.set(
      presenceRef,
      {
        status: 'offline',
        role: 'host',
        lastSeen: now,
        heartbeatAt: now,
      },
      { merge: true }
    );
  });

  return { success: true, uid };
});
