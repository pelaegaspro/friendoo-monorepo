import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { admin, getDb } from '../firebaseAdmin';

const highTopupAlert = onDocumentCreated(
  { document: 'coinTransactions/{txId}', region: 'asia-south1' },
  async (event) => {
    const txId = event.params.txId as string;
    const data = event.data?.data() as
      | { userId?: string; type?: string; amountInr?: number; createdAt?: admin.firestore.Timestamp }
      | undefined;
    if (!data || data.type !== 'topup' || typeof data.amountInr !== 'number' || data.amountInr <= 500) return;
    if (!data.userId) return;

    const db = getDb();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayTopups = await db
      .collection('coinTransactions')
      .where('userId', '==', data.userId)
      .where('type', '==', 'topup')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(dayStart))
      .get();

    const totalToday = todayTopups.docs.reduce((sum, doc) => {
      const amount = doc.data().amountInr;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    if (totalToday <= 1000) return;

    await db.collection('fraudAlerts').add({
      userId: data.userId,
      type: 'high_topup',
      severity: 'high',
      description: `User topped up ₹${totalToday.toFixed(0)} in one day`,
      relatedTxId: txId,
      amount: totalToday,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

const droppedCallRefundAlert = onDocumentUpdated(
  { document: 'calls/{callId}', region: 'asia-south1' },
  async (event) => {
    const callId = event.params.callId as string;
    const before = event.data?.before.data() as { status?: string } | undefined;
    const after = event.data?.after.data() as
      | { status?: string; endReason?: string; finalDurationSeconds?: number; fromUserId?: string }
      | undefined;
    if (!before || !after) return;
    if (before.status === after.status) return;
    if (!(after.status === 'ended' && after.endReason === 'insufficientbalance')) return;
    const finalDurationSeconds =
      typeof after.finalDurationSeconds === 'number' ? after.finalDurationSeconds : 0;
    if (finalDurationSeconds >= 30) return;

    const db = getDb();
    await db.collection('fraudAlerts').add({
      userId: after.fromUserId || '',
      type: 'call_refund_needed',
      severity: 'medium',
      description: `Call ended in ${finalDurationSeconds} seconds due to low balance — possible refund`,
      relatedCallId: callId,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

export const fraudHighTopupAlert = highTopupAlert;
export const fraudDroppedCallAlert = droppedCallRefundAlert;
