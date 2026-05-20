import * as crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';

// ── Types ──

type CashfreeWebhookEvent = {
  event: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_status: string;
      customer_details: {
        customer_id: string;
        customer_email: string;
        customer_phone: string;
      };
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_method?: string;
      payment_time?: string;
    };
  };
};

type PendingTransaction = {
  id: string;
  userId: string;
  status: string;
  cashfreeOrderId: string;
  amountCoins: number;
  packageId: string;
};

// ── Helpers ──

function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, timestamp: string | undefined): boolean {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing CASHFREE_WEBHOOK_SECRET env var');
    return false;
  }
  if (!signatureHeader || !timestamp) {
    return false;
  }

  const signedPayload = timestamp + rawBody.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signatureHeader, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

function badRequest(res: Response, msg: string) {
  return res.status(400).json({ error: msg });
}

// ── Express App ──

const app = express();

// Preserve raw body for signature verification. Accept any path so the deployed
// function URL works directly and also tolerates a trailing webhook path.
app.post('*', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const rawBody = req.body as Buffer;
  const signature = req.header('x-webhook-signature') ?? req.header('X-Webhook-Signature');
  const timestamp = req.header('x-webhook-timestamp') ?? req.header('X-Webhook-Timestamp');

  // 1. Verify signature — return 200 even on failure to prevent Cashfree retries
  if (!verifySignature(rawBody, signature, timestamp)) {
    console.error('cashfreeWebhook: Invalid signature — ignoring event');
    return res.status(200).json({ status: 'signature_invalid' });
  }

  let event: CashfreeWebhookEvent;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return badRequest(res, 'Invalid JSON');
  }

  const { event: eventType, data } = event;
  const orderId = data?.order?.order_id;
  const customerId = data?.order?.customer_details?.customer_id;

  if (!orderId) {
    return badRequest(res, 'Missing order_id');
  }

  console.log(`cashfreeWebhook: event=${eventType}, orderId=${orderId}`);

  const db = getDb();

  try {
    // Normalize event type — 2023-08-01 uses _WEBHOOK suffix
    const normalizedEvent = eventType.replace(/_WEBHOOK$/, '');

    switch (normalizedEvent) {
      // ── Payment Success ──
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_CHARGES': {
        // Find pending transaction by cashfreeOrderId
        const txSnap = await db.collection('coinTransactions')
          .where('cashfreeOrderId', '==', orderId)
          .where('status', '==', 'pending')
          .limit(1)
          .get();

        if (txSnap.empty) {
          console.warn(`cashfreeWebhook: No pending transaction for orderId=${orderId}`);
          // Idempotent: if already succeeded, just acknowledge
          const existingSnap = await db.collection('coinTransactions')
            .where('cashfreeOrderId', '==', orderId)
            .where('status', '==', 'success')
            .limit(1)
            .get();
          if (!existingSnap.empty) {
            console.log(`cashfreeWebhook: Already processed orderId=${orderId}, skipping`);
            return res.status(200).json({ status: 'already_processed' });
          }
          return res.status(200).json({ status: 'no_pending_transaction' });
        }

        const txDoc = txSnap.docs[0];
        const txData = txDoc.data() as PendingTransaction;

        // Verify customer_id matches userId on the transaction
        if (customerId && customerId !== txData.userId) {
          console.error(`cashfreeWebhook: Customer mismatch! cashfree=${customerId}, firestore=${txData.userId}`);
          return badRequest(res, 'Customer mismatch');
        }

        // Run Firestore transaction to credit coins
        await db.runTransaction(async (t) => {
          const userRef = db.collection('users').doc(txData.userId);
          const userDoc = await t.get(userRef);

          const currentBalance: number = userDoc.exists
            ? typeof userDoc.data()?.coinBalance === 'number'
              ? (userDoc.data()!.coinBalance as number)
              : 0
            : 0;

          const newBalance = currentBalance + txData.amountCoins;

          // Credit coins — set both fields for backward compatibility
          t.set(userRef, {
            coinBalance: newBalance,
            coins: newBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // Update transaction to success
          t.update(txDoc.ref, {
            status: 'success',
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            cashfreePaymentId: data?.payment?.cf_payment_id ?? null,
            paymentMethod: data?.payment?.payment_method ?? null,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          t.set(db.collection('transactions').doc(txDoc.id), {
            userId: txData.userId,
            type: 'topup',
            status: 'success',
            cashfreeOrderId: orderId,
            cashfreePaymentId: data?.payment?.cf_payment_id ?? null,
            packageId: txData.packageId,
            amountCoins: txData.amountCoins,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        });

        console.log(`cashfreeWebhook: Credited ${txData.amountCoins} coins to user=${txData.userId}, orderId=${orderId}`);
        return res.status(200).json({ status: 'credited', coins: txData.amountCoins });
      }

      // ── Payment Failed ──
      case 'PAYMENT_FAILED': {
        const txSnap = await db.collection('coinTransactions')
          .where('cashfreeOrderId', '==', orderId)
          .where('status', '==', 'pending')
          .limit(1)
          .get();

        if (!txSnap.empty) {
          await txSnap.docs[0].ref.update({
            status: 'failed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`cashfreeWebhook: Marked orderId=${orderId} as failed`);
        }
        return res.status(200).json({ status: 'failed' });
      }

      // ── Dispute Events ──
      case 'DISPUTE_OPENED':
      case 'DISPUTE_CREATED':
      case 'DISPUTE_UPDATED':
      case 'DISPUTE': {
        // Find user from transaction
        const txSnap = await db.collection('coinTransactions')
          .where('cashfreeOrderId', '==', orderId)
          .limit(1)
          .get();

        const userId = txSnap.empty ? customerId : (txSnap.docs[0].data() as PendingTransaction).userId;

        if (userId) {
          // Freeze user wallet
          await db.collection('users').doc(userId).set({
            walletFrozen: true,
            walletFrozenReason: 'dispute',
            walletFrozenAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          // Log to fraudAlerts
          await db.collection('fraudAlerts').add({
            type: 'dispute_opened',
            userId,
            cashfreeOrderId: orderId,
            severity: 'HIGH',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`cashfreeWebhook: Froze wallet for user=${userId} due to dispute on orderId=${orderId}`);
        }
        return res.status(200).json({ status: 'dispute_handled' });
      }

      // ── Dispute Resolved (in our favor) ──
      case 'DISPUTE_CLOSED':
      case 'DISPUTE_RESOLVED':
      case 'DISPUTE_COMPLETED': {
        const txSnap = await db.collection('coinTransactions')
          .where('cashfreeOrderId', '==', orderId)
          .limit(1)
          .get();

        const userId = txSnap.empty ? customerId : (txSnap.docs[0].data() as PendingTransaction).userId;

        if (userId) {
          await db.collection('users').doc(userId).set({
            walletFrozen: false,
            walletFrozenReason: admin.firestore.FieldValue.delete(),
            walletFrozenAt: admin.firestore.FieldValue.delete(),
          }, { merge: true });

          console.log(`cashfreeWebhook: Unfroze wallet for user=${userId}, dispute resolved`);
        }
        return res.status(200).json({ status: 'dispute_resolved' });
      }

      default:
        console.log(`cashfreeWebhook: Unhandled event type: ${eventType}`);
        return res.status(200).json({ status: 'ignored' });
    }
  } catch (err) {
    console.error('cashfreeWebhook: Error processing event', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export const cashfreeWebhook = onRequest({ region: 'asia-south1' }, app);
