import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';

/**
 * deductCallCoins — callable Cloud Function
 *
 * Atomically deducts coins for a call minute.
 * Fetches coinsPerMinute from hosts/{hostId} SERVER-SIDE — never trusts client-supplied rate.
 * Writes a coinTransactions record.
 *
 * Security: coinBalance is ONLY written by this function (Admin SDK), never by the client.
 */
export const deductCallCoins = onCall(
  { region: 'asia-south1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const uid = request.auth.uid;
    const { hostId, callId, callType } = request.data as { hostId?: string; callId?: string; callType?: string };

    if (!hostId || typeof hostId !== 'string') {
      throw new HttpsError('invalid-argument', 'hostId is required.');
    }

    const db = getDb();

    return db.runTransaction(async (transaction) => {
      // Fetch coinsPerMinute from server — NEVER use client-supplied value
      // Use video rate if callType is 'video', otherwise audio rate
      const hostRef = db.collection('hosts').doc(hostId);
      const hostDoc = await transaction.get(hostRef);
      if (!hostDoc.exists) {
        throw new HttpsError('not-found', `Host ${hostId} not found.`);
      }
      const hostData = hostDoc.data()!;
      const isVideo = callType === 'video';
      const coinsPerMinute: number = isVideo
        ? (typeof hostData.ratePerVideoMinute === 'number' ? hostData.ratePerVideoMinute : 10)
        : (typeof hostData.ratePerAudioMinute === 'number' ? hostData.ratePerAudioMinute
          : typeof hostData.coinsPerMinute === 'number' ? hostData.coinsPerMinute : 5);

      // Read user balance
      const userRef = db.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found.');
      }

      const currentBalance: number =
        typeof userDoc.data()?.coinBalance === 'number'
          ? (userDoc.data()!.coinBalance as number)
          : typeof userDoc.data()?.coins === 'number'
          ? (userDoc.data()!.coins as number)
          : 0;

      if (currentBalance < coinsPerMinute) {
        throw new HttpsError('failed-precondition', 'Insufficient coins.');
      }

      const newBalance = currentBalance - coinsPerMinute;

      // Deduct coins — Admin SDK write, blocked for clients by Firestore rules
      transaction.update(userRef, {
        coinBalance: newBalance,
        coins: newBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Write transaction log
      const txRef = db.collection('coinTransactions').doc();
      transaction.set(txRef, {
        userId: uid,
        type: 'debit',
        amount: coinsPerMinute,
        coins: coinsPerMinute,
        description: callId ? `Call charge — ${callId}` : 'Call charge',
        hostId,
        callId: callId ?? null,
        balanceAfter: newBalance,
        coinsPerMinuteSource: 'hosts_collection_server_side',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, newBalance };
    });
  }
);

/**
 * addCoins — callable Cloud Function
 *
 * Atomically credits coins to a user's balance.
 * Only called after a verified payment (Cashfree webhook handles purchase credits;
 * this function is for admin/internal top-ups).
 *
 * Security: coinBalance is ONLY written by this function (Admin SDK), never by the client.
 */
export const addCoins = onCall(
  { region: 'asia-south1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required.');
    }

    const uid = request.auth.uid;
    const { amount, description, paymentId, packageId } = request.data as {
      amount?: number;
      description?: string;
      paymentId?: string;
      packageId?: string;
    };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new HttpsError('invalid-argument', 'amount must be a positive number.');
    }

    const db = getDb();

    return db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);

      const currentBalance: number = userDoc.exists
        ? typeof userDoc.data()?.coinBalance === 'number'
          ? (userDoc.data()!.coinBalance as number)
          : typeof userDoc.data()?.coins === 'number'
          ? (userDoc.data()!.coins as number)
          : 0
        : 0;

      const newBalance = currentBalance + amount;

      // Credit coins — Admin SDK write, blocked for clients by Firestore rules
      transaction.set(
        userRef,
        {
          coinBalance: newBalance,
          coins: newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Write transaction log
      const txRef = db.collection('coinTransactions').doc();
      transaction.set(txRef, {
        userId: uid,
        type: 'credit',
        amount,
        coins: amount,
        description: description ?? 'Coins added',
        ...(paymentId ? { paymentId } : {}),
        ...(packageId ? { packageId } : {}),
        balanceAfter: newBalance,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, newBalance };
    });
  }
);
