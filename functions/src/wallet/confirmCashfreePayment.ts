import { onCall, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';
import { getCashfreeBaseUrl, getCashfreeHeaders, resolveCashfreeEnv } from './cashfreeConfig';
import { creditTopupFromOrder } from './creditTopupFromOrder';

/**
 * Client fallback when Cashfree webhook is delayed or missed.
 * Verifies order is PAID with Cashfree API, then credits coins idempotently.
 */
export const confirmCashfreePayment = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { orderId, userId: requestedUserId, cashfreeEnv } = request.data as {
      orderId?: string;
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
    if (!orderId || typeof orderId !== 'string') {
      throw new HttpsError('invalid-argument', 'orderId is required');
    }

    const env = resolveCashfreeEnv(cashfreeEnv);
    const baseUrl = getCashfreeBaseUrl(env);
    const headers = getCashfreeHeaders(env);

    try {
      const response = await axios.get(`${baseUrl}/orders/${orderId}`, {
        headers,
        timeout: 8_000,
      });

      const orderStatus = response.data?.order_status as string | undefined;
      const payments = response.data?.payments as Array<{ payment_status?: string }> | undefined;
      const hasSuccessfulPayment = payments?.some(
        (p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID'
      );

      const isPaid = orderStatus === 'PAID' || hasSuccessfulPayment === true;

      if (!isPaid) {
        return {
          credited: false,
          orderStatus: orderStatus ?? 'UNKNOWN',
          message: 'Payment not completed yet',
        };
      }

      const payment = payments?.find(
        (p) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID'
      ) as { cf_payment_id?: string; payment_method?: string } | undefined;

      const result = await creditTopupFromOrder(orderId, userId, {
        cashfreePaymentId: payment?.cf_payment_id ?? null,
        paymentMethod: payment?.payment_method ?? null,
      });

      console.log(`confirmCashfreePayment: orderId=${orderId}, userId=${userId}, result=${JSON.stringify(result)}`);

      return {
        ...result,
        orderStatus,
      };
    } catch (error: any) {
      console.error('confirmCashfreePayment error:', error.response?.data || error.message);
      throw new HttpsError('internal', 'Failed to confirm payment');
    }
  }
);
