export type CashfreeEnv = 'sandbox' | 'production';

export function resolveCashfreeEnv(clientEnv?: unknown): CashfreeEnv {
  if (clientEnv === 'sandbox') return 'sandbox';
  const appId = process.env.CASHFREE_APP_ID ?? '';
  if (appId.startsWith('TEST')) return 'sandbox';
  const env = process.env.CASHFREE_ENV || 'sandbox';
  return env === 'production' ? 'production' : 'sandbox';
}

export function getCashfreeBaseUrl(env: CashfreeEnv): string {
  return env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export function getCashfreeCredentials(env: CashfreeEnv): { appId: string; secretKey: string } {
  if (env === 'sandbox') {
    const appId = process.env.CASHFREE_SANDBOX_APP_ID || process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SANDBOX_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
      throw new Error('Missing sandbox Cashfree env vars');
    }
    return { appId, secretKey };
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error('Missing Cashfree env vars: CASHFREE_APP_ID / CASHFREE_SECRET_KEY');
  }
  return { appId, secretKey };
}

export function getCashfreeHeaders(env: CashfreeEnv) {
  const { appId, secretKey } = getCashfreeCredentials(env);
  return {
    'x-api-version': '2023-08-01',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'Content-Type': 'application/json',
  };
}
