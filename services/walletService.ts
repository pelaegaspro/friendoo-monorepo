import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { CoinPackage, CoinTransaction } from '../src/types/wallet';

function getFirebase() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, 'asia-south1');
  return { app, auth, db, functions };
}

export const walletService = {
  subscribeCoinBalance(userId: string, cb: (balance: number) => void): Unsubscribe {
    const { db } = getFirebase();
    return onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        const data = snap.data() as { coinBalance?: unknown } | undefined;
        const coinBalance = typeof data?.coinBalance === 'number' ? data.coinBalance : 0;
        cb(Math.max(0, coinBalance));
      },
      (err) => {
        console.error('subscribeCoinBalance failed', err);
        cb(0);
      }
    );
  },

  async fetchCoinPackages(): Promise<CoinPackage[]> {
    const { db } = getFirebase();
    const q = query(collection(db, 'coinPackages'), where('active', '==', true), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) } as CoinPackage));
  },

  async fetchRecentTransactions(userId: string): Promise<CoinTransaction[]> {
    const { db } = getFirebase();
    const q = query(
      collection(db, 'coinTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) } as CoinTransaction));
  },

  subscribeRecentTransactions(userId: string, cb: (txns: CoinTransaction[]) => void): Unsubscribe {
    const { db } = getFirebase();
    const q = query(
      collection(db, 'coinTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) } as CoinTransaction))),
      (err) => {
        console.error('subscribeRecentTransactions failed', err);
        cb([]);
      }
    );
  },

  async openTopupCheckout(args: { packageId: string; userId: string; onSuccess: () => void; onFailure: (msg: string) => void }) {
    const { functions } = getFirebase();

    try {
      const callable = httpsCallable(functions, 'createCashfreeOrder');
      const result = await callable({ packageId: args.packageId });
      const data = result.data as { orderId?: string; paymentSessionId?: string; coins?: number };

      if (!data.orderId || !data.paymentSessionId) {
        args.onFailure('Failed to create payment order');
        return;
      }

      // Cashfree hosted checkout page
      const env = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
      const baseUrl = env === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
      const checkoutUrl = `${baseUrl}/pg/checkout?payment_session_id=${data.paymentSessionId}`;

      window.open(checkoutUrl, '_blank');
      args.onSuccess();
    } catch (err: any) {
      args.onFailure(err.message || 'Payment failed');
    }
  },

  async getCoinBalanceOnce(userId: string) {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', userId));
    const data = snap.data() as { coinBalance?: unknown } | undefined;
    return typeof data?.coinBalance === 'number' ? Math.max(0, data.coinBalance) : 0;
  },

  getCurrentUserId() {
    const { auth } = getFirebase();
    return auth.currentUser?.uid ?? null;
  },
};
