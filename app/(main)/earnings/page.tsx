'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { getApps, initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/authStore';
import { useProfile } from '../../../hooks/useProfile';

type HostEarningTx = {
  id: string;
  amountCoins: number;
  callerId?: string;
  finalDurationSeconds?: number;
  createdAt?: Date;
};

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
  const db = getFirestore(app);
  return { db };
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} mins ${secs} sec`;
}

function maskCaller(callerId?: string) {
  if (!callerId) return 'User****';
  return `User${callerId.slice(-4).padStart(4, '*')}`;
}

export default function EarningsPage() {
  const router = useRouter();
  const uid = useAuthStore((state) => state.user?.uid) || '';
  const { profile, isLoading } = useProfile(uid);
  const [transactions, setTransactions] = useState<HostEarningTx[]>([]);
  const [todayCalls, setTodayCalls] = useState(0);
  const [allTimeCalls, setAllTimeCalls] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const { db } = getFirebase();
    const q = query(
      collection(db, 'coinTransactions'),
      where('userId', '==', uid),
      where('type', '==', 'hostearning'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const createdAt =
          data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === 'function'
            ? (data.createdAt as { toDate: () => Date }).toDate()
            : undefined;
        return {
          id: doc.id,
          amountCoins: typeof data.amountCoins === 'number' ? data.amountCoins : 0,
          callerId: typeof data.callerId === 'string' ? data.callerId : undefined,
          finalDurationSeconds:
            typeof data.finalDurationSeconds === 'number' ? data.finalDurationSeconds : undefined,
          createdAt,
        } as HostEarningTx;
      });
      setTransactions(next);
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const { db } = getFirebase();
    const loadStats = async () => {
      const [allCallsSnap, todayCallsSnap] = await Promise.all([
        getDocs(query(collection(db, 'calls'), where('toUserId', '==', uid))),
        getDocs(
          query(
            collection(db, 'calls'),
            where('toUserId', '==', uid),
            where('createdAt', '>=', startOfDay(new Date()))
          )
        ),
      ]);
      setAllTimeCalls(allCallsSnap.size);
      setTodayCalls(todayCallsSnap.size);
    };
    void loadStats();
  }, [uid]);

  if (!uid) return null;
  if (!isLoading && !profile?.isHost) {
    router.replace('/discover');
    return null;
  }

  const totalEarned = transactions.reduce((sum, tx) => sum + tx.amountCoins, 0);
  const weekStart = subDays(new Date(), 7).getTime();
  const thisWeekEarnings = transactions
    .filter((tx) => (tx.createdAt?.getTime() ?? 0) >= weekStart)
    .reduce((sum, tx) => sum + tx.amountCoins, 0);

  return (
    <main className="min-h-dvh bg-background px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] text-white">
      <div className="mx-auto w-full max-w-md space-y-5">
        <section className="rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-5 shadow-xl shadow-purple-900/30">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-100/80">Total Earned</p>
          <p className="mt-2 text-3xl font-black">{totalEarned.toLocaleString()} 🪙</p>
          <p className="mt-2 text-sm text-purple-100/90">
            {totalEarned.toLocaleString()} coins = ₹{(totalEarned * 0.1).toFixed(2)} approx
          </p>
          <button
            type="button"
            onClick={() => toast('Withdrawal coming soon! Minimum 500 coins.')}
            className="mt-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white"
          >
            Withdraw
          </button>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-center">
            <p className="text-[11px] text-zinc-400">Today Calls</p>
            <p className="mt-2 text-xl font-black">{todayCalls}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-center">
            <p className="text-[11px] text-zinc-400">This Week</p>
            <p className="mt-2 text-xl font-black">{thisWeekEarnings}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-center">
            <p className="text-[11px] text-zinc-400">All Calls</p>
            <p className="mt-2 text-xl font-black">{allTimeCalls}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">Recent Earnings</h2>
          {transactions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
              No earnings yet.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-zinc-100">{maskCaller(tx.callerId)}</div>
                  <div className="text-sm font-bold text-green-400">+{tx.amountCoins} 🪙</div>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {formatDuration(tx.finalDurationSeconds ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {tx.createdAt ? formatDistanceToNow(tx.createdAt, { addSuffix: true }) : 'just now'}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          🪙 Coins convert to ₹ at ₹0.10/coin
          <br />
          Minimum withdrawal: 500 coins = ₹50
          <br />
          Payouts processed within 3-5 business days
        </section>
      </div>
    </main>
  );
}
