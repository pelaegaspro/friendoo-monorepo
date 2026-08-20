import { admin, getDb } from '../firebaseAdmin';

export type CreditTopupResult = {
  credited: boolean;
  alreadyProcessed?: boolean;
  coins?: number;
  newBalance?: number;
  reason?: string;
};

type TopupTransaction = {
  id: string;
  userId: string;
  status: string;
  cashfreeOrderId: string;
  amountCoins: number;
  packageId?: string;
};

/**
 * Idempotently credits coins for a Cashfree order (webhook + client confirm fallback).
 */
export async function creditTopupFromOrder(
  orderId: string,
  expectedUserId?: string,
  paymentMeta?: { cashfreePaymentId?: string | null; paymentMethod?: string | null }
): Promise<CreditTopupResult> {
  const db = getDb();

  const txSnap = await db.collection('coinTransactions')
    .where('cashfreeOrderId', '==', orderId)
    .limit(1)
    .get();

  if (txSnap.empty) {
    return { credited: false, reason: 'no_transaction' };
  }

  const txDoc = txSnap.docs[0];
  const txData = txDoc.data() as TopupTransaction;

  if (expectedUserId && txData.userId !== expectedUserId) {
    return { credited: false, reason: 'user_mismatch' };
  }

  if (txData.status === 'success') {
    return { credited: true, alreadyProcessed: true, coins: txData.amountCoins };
  }

  if (txData.status !== 'pending') {
    return { credited: false, reason: `invalid_status_${txData.status}` };
  }

  let newBalance = 0;

  await db.runTransaction(async (t) => {
    const freshTx = await t.get(txDoc.ref);
    const fresh = freshTx.data() as TopupTransaction | undefined;
    if (!fresh) {
      throw new Error('transaction_missing');
    }
    if (fresh.status === 'success') {
      return;
    }
    if (fresh.status !== 'pending') {
      throw new Error(`invalid_status_${fresh.status}`);
    }

    const userRef = db.collection('users').doc(fresh.userId);
    const userDoc = await t.get(userRef);

    const currentBalance: number = userDoc.exists
      ? typeof userDoc.data()?.coinBalance === 'number'
        ? (userDoc.data()!.coinBalance as number)
        : typeof userDoc.data()?.coins === 'number'
          ? (userDoc.data()!.coins as number)
          : 0
      : 0;

    newBalance = currentBalance + fresh.amountCoins;

    t.set(userRef, {
      coinBalance: newBalance,
      coins: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    t.update(txDoc.ref, {
      status: 'success',
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      cashfreePaymentId: paymentMeta?.cashfreePaymentId ?? null,
      paymentMethod: paymentMeta?.paymentMethod ?? null,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    t.set(db.collection('transactions').doc(txDoc.id), {
      userId: fresh.userId,
      type: 'topup',
      status: 'success',
      cashfreeOrderId: orderId,
      cashfreePaymentId: paymentMeta?.cashfreePaymentId ?? null,
      packageId: fresh.packageId ?? null,
      amountCoins: fresh.amountCoins,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return {
    credited: true,
    coins: txData.amountCoins,
    newBalance,
  };
}
