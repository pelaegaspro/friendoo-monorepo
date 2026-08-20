import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { admin, getDb } from '../firebaseAdmin';

export const lowBalanceTrigger = onDocumentUpdated(
  { document: 'users/{uid}', region: 'asia-south1' },
  async (event) => {
    const before = event.data?.before.data() as { coinBalance?: number } | undefined;
    const after = event.data?.after.data() as { coinBalance?: number; fcmTokens?: unknown } | undefined;
    const uid = event.params.uid as string;

    if (!before || !after) return;
    if (!((before.coinBalance ?? 0) >= 15 && (after.coinBalance ?? 0) < 15)) return;

    const db = getDb();
    const recentCall = await db
      .collection('calls')
      .where('fromUserId', '==', uid)
      .where(
        'createdAt',
        '>=',
        admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000)
      )
      .limit(1)
      .get();

    if (recentCall.empty) return;

    const tokens = Array.isArray(after.fcmTokens)
      ? after.fcmTokens.filter((token): token is string => typeof token === 'string' && token.length > 0)
      : [];
    if (!tokens.length) return;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '🪙 Running low on coins!',
        body: 'Top up now to keep calling your favourite hosts.',
      },
      data: { type: 'low_balance', screen: 'wallet' },
    });
  }
);
