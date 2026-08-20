import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';

const REGION = { region: 'asia-south1' as const };

/**
 * Completes user onboarding — users only (never promotes to host).
 */
export const completeUserOnboarding = onCall(REGION, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Login required');
  const uid = request.auth.uid;

  const {
    displayName,
    avatarUrl,
    avatarSeed,
    avatarConfig,
    avatarVersion = 1,
    gender = 'male',
  } = request.data as {
    displayName?: string;
    avatarUrl?: string;
    avatarSeed?: string;
    avatarConfig?: Record<string, unknown>;
    avatarVersion?: number;
    gender?: string;
  };

  if (!displayName || displayName.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'displayName is required');
  }

  const db = getDb();
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  if (snap.exists && snap.data()?.isHost === true) {
    throw new HttpsError('failed-precondition', 'Hosts must complete onboarding via admin flow');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await userRef.set(
    {
      uid,
      displayName: displayName.trim(),
      alias: displayName.trim(),
      role: 'user',
      accountType: 'user',
      isHost: false,
      gender: gender === 'female' ? 'female' : 'male',
      avatarUrl: avatarUrl || '',
      avatarSeed: avatarSeed || uid,
      avatarConfig: avatarConfig || {},
      avatarVersion,
      onboardingCompleted: true,
      onboardingComplete: true,
      createdAt: snap.exists ? snap.data()?.createdAt || now : now,
      updatedAt: now,
      lastActive: now,
    },
    { merge: true }
  );

  await db.collection('presence').doc(uid).set(
    {
      status: 'offline',
      role: 'user',
      lastSeen: now,
      heartbeatAt: now,
    },
    { merge: true }
  );

  return { success: true, onboardingCompleted: true, isHost: false };
});
