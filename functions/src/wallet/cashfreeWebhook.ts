import * as crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { admin, getDb } from '../firebaseAdmin';
import { creditTopupFromOrder } from './creditTopupFromOrder';

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

// Firebase Cloud Functions automatically preserve the raw request body as
// req.rawBody (a Buffer) before any JSON parsing occurs. We rely on this
// for HMAC-SHA256 signature verification against Cashfree webhook payloads.
app.post('*', express.json(), async (req: Request, res: Response) => {
  // Firebase exposes the raw body buffer on req.rawBody
  const rawBody: Buffer = (req as any).rawBody as Buffer;
  const signature = req.header('x-webhook-signature') ?? req.header('X-Webhook-Signature');
  const timestamp = req.header('x-webhook-timestamp') ?? req.header('X-Webhook-Timestamp');

  console.log(`cashfreeWebhook: received rawBody type=${typeof rawBody}, isBuffer=${Buffer.isBuffer(rawBody)}, length=${Buffer.isBuffer(rawBody) ? rawBody.length : 'N/A'}`);
  if (Buffer.isBuffer(rawBody) && process.env.NODE_ENV !== 'production') {
    console.log(`cashfreeWebhook: rawBody content="${rawBody.toString('utf8')}"`);
  }
  console.log(`cashfreeWebhook: secret configured=${!!process.env.CASHFREE_WEBHOOK_SECRET}`);
  console.log(`cashfreeWebhook: header signature="${signature}", timestamp="${timestamp}"`);

  // 1. Verify signature — return 200 even on failure to prevent Cashfree retries
  if (!verifySignature(rawBody, signature, timestamp)) {
    console.error('cashfreeWebhook: Invalid signature — ignoring event');
    return res.status(200).json({ status: 'signature_invalid' });
  }

  // Parse event from the already-parsed body (express.json() ran before this handler)
  // or fall back to manual parse from rawBody if body is not already an object
  let event: CashfreeWebhookEvent;
  try {
    if (req.body && typeof req.body === 'object') {
      event = req.body as CashfreeWebhookEvent;
    } else if (Buffer.isBuffer(rawBody)) {
      event = JSON.parse(rawBody.toString('utf8'));
    } else {
      return badRequest(res, 'No parseable body');
    }
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
        if (customerId) {
          const txSnap = await db.collection('coinTransactions')
            .where('cashfreeOrderId', '==', orderId)
            .limit(1)
            .get();
          const txUserId = txSnap.empty ? null : (txSnap.docs[0].data() as PendingTransaction).userId;
          if (txUserId && customerId !== txUserId) {
            console.error(`cashfreeWebhook: Customer mismatch! cashfree=${customerId}, firestore=${txUserId}`);
            return badRequest(res, 'Customer mismatch');
          }
        }

        const result = await creditTopupFromOrder(orderId, customerId, {
          cashfreePaymentId: data?.payment?.cf_payment_id ?? null,
          paymentMethod: data?.payment?.payment_method ?? null,
        });

        if (result.credited) {
          console.log(`cashfreeWebhook: Credited orderId=${orderId}, coins=${result.coins}`);
          return res.status(200).json({ status: 'credited', coins: result.coins });
        }

        console.warn(`cashfreeWebhook: Could not credit orderId=${orderId}, reason=${result.reason}`);
        return res.status(200).json({ status: result.reason ?? 'not_credited' });
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
