import { onCall, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';
import { getDb, admin } from '../firebaseAdmin';
import { getCashfreeBaseUrl, getCashfreeHeaders, resolveCashfreeEnv } from './cashfreeConfig';

type CoinPackageDoc = {
  active?: boolean;
  currency?: string;
  priceInr?: number;
  coins?: number;
  bonus?: number;
  displayName?: string;
};

export const createCashfreeOrder = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { packageId, userId: requestedUserId, cashfreeEnv } = request.data as {
      packageId?: string;
      userId?: string;
      cashfreeEnv?: string;
    };
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Login required');
    }
    const userId = request.auth.uid;

    if (requestedUserId && requestedUserId !== userId) {
      throw new HttpsError('permission-denied', 'userId mismatch');
    }

    if (!packageId || typeof packageId !== 'string') {
      throw new HttpsError('invalid-argument', 'packageId is required');
    }

    const db = getDb();

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

    const orderId = `order_${userId.slice(0, 8)}_${Date.now()}`;
    const env = resolveCashfreeEnv(cashfreeEnv);
    const baseUrl = getCashfreeBaseUrl(env);
    const headers = getCashfreeHeaders(env);

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
        { headers, timeout: 8_000 }
      );

      const cashfreeOrderId = response.data.order_id;
      const paymentSessionId = response.data.payment_session_id;

      if (!cashfreeOrderId || !paymentSessionId) {
        throw new Error('Cashfree response missing order_id or payment_session_id');
      }

      // Must complete before webhook / confirm can find pending transaction
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

      console.log(`createCashfreeOrder: env=${env}, userId=${userId}, orderId=${cashfreeOrderId}, coins=${totalCoins}, price=${priceInr}`);

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
