import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { admin, getDb } from '../firebaseAdmin';

export const welcomeBonusTrigger = onDocumentCreated(
  { document: 'users/{uid}', region: 'asia-south1' },
  async (event) => {
    const uid = event.params.uid as string;
    const data = event.data?.data();
    if (!data) return;

    const db = getDb();
    const configSnap = await db.collection('config').doc('appSettings').get();
    const welcomeCoinsRaw = configSnap.exists ? configSnap.data()?.welcomeBonus : undefined;
    const welcomeCoins = typeof welcomeCoinsRaw === 'number' ? welcomeCoinsRaw : 50;

    await db.collection('users').doc(uid).set(
      {
        avatarSeed: uid,
        coinBalance: admin.firestore.FieldValue.increment(welcomeCoins),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await db.collection('coinTransactions').add({
      userId: uid,
      type: 'bonus',
      amountCoins: welcomeCoins,
      balanceBefore: 0,
      balanceAfter: welcomeCoins,
      status: 'success',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: 'welcome_bonus',
    });
  }
);
