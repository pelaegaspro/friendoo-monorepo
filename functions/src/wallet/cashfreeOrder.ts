import { onCall, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';
import { getDb, admin } from '../firebaseAdmin';

// ── Types ──

type CoinPackageDoc = {
  active?: boolean;
  currency?: string;
  priceInr?: number;
  coins?: number;
  bonus?: number;
  displayName?: string;
};

// ── Cashfree API Config ──

function getCashfreeBaseUrl(): string {
  const env = process.env.CASHFREE_ENV || 'sandbox';
  return env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function getCashfreeHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error('Missing Cashfree env vars: CASHFREE_APP_ID / CASHFREE_SECRET_KEY');
  }
  return {
    'x-api-version': '2023-08-01',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'Content-Type': 'application/json',
  };
}

// ── Cloud Function ──

export const createCashfreeOrder = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { packageId, userId: requestedUserId } = request.data as {
      packageId?: string;
      userId?: string;
    };
    const userId = request.auth?.uid ?? requestedUserId;

    if (!userId || typeof userId !== 'string') {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    if (!packageId || typeof packageId !== 'string') {
      throw new HttpsError('invalid-argument', 'packageId is required');
    }

    const db = getDb();

    // 1. Read coin package from Firestore
    const pkgRef = db.collection('coinPackages').doc(packageId);
    const pkgSnap = await pkgRef.get();

    if (!pkgSnap.exists) {
      throw new HttpsError('not-found', 'Invalid coin package');
    }

    const pkg = pkgSnap.data() as CoinPackageDoc;
    if (!pkg.active) {
      throw new HttpsError('failed-precondition', 'Coin package is not active');
    }

    const priceInr = pkg.priceInr ?? 0;
    const coins = pkg.coins ?? 0;
    const bonus = pkg.bonus ?? 0;
    const totalCoins = coins + bonus;

    if (priceInr <= 0 || coins <= 0) {
      throw new HttpsError('failed-precondition', 'Invalid package pricing');
    }

    // 2. Create Cashfree order
    const orderId = `order_${userId.slice(0, 8)}_${Date.now()}`;
    const baseUrl = getCashfreeBaseUrl();
    const headers = getCashfreeHeaders();

    try {
      const response = await axios.post(
        `${baseUrl}/orders`,
        {
          order_id: orderId,
          order_amount: priceInr,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_email: request.auth?.token?.email || 'noreply@friendoo.in',
            customer_phone: request.auth?.token?.phone_number || '9999999999',
          },
          order_meta: {
            return_url: `https://friendoo.in/payment/callback?order_id=${orderId}`,
          },
        },
        { headers }
      );

      const cashfreeOrderId = response.data.order_id;
      const paymentSessionId = response.data.payment_session_id;

      if (!cashfreeOrderId || !paymentSessionId) {
        throw new Error('Cashfree response missing order_id or payment_session_id');
      }

      // 3. Create pending transaction in Firestore (idempotency key)
      const txRef = db.collection('coinTransactions').doc();
      await txRef.set({
        userId,
        type: 'topup',
        status: 'pending',
        cashfreeOrderId,
        packageId,
        amountInr: priceInr,
        currency: 'INR',
        amountCoins: totalCoins,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`createCashfreeOrder: userId=${userId}, orderId=${cashfreeOrderId}, coins=${totalCoins}, price=${priceInr}`);

      return {
        orderId: cashfreeOrderId,
        paymentSessionId,
        amount: priceInr,
        coins: totalCoins,
      };
    } catch (error: any) {
      console.error('createCashfreeOrder error:', error.response?.data || error.message);
      throw new HttpsError('internal', 'Failed to create payment order');
    }
  }
);
