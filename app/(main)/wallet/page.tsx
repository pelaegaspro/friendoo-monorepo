'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import { CoinBalance } from '../../../components/wallet/CoinBalance';
import { CoinPackageCard } from '../../../components/wallet/CoinPackageCard';
import { TransactionHistory } from '../../../components/wallet/TransactionHistory';
import { toast } from 'sonner';
import { getApps, initializeApp } from 'firebase/app';
import { doc, getFirestore, onSnapshot, Timestamp } from 'firebase/firestore';

type ActiveOffer = {
  bonusCoins: number;
  discountPercent?: number;
  packageId?: string;
  expiresAt: Date;
  active: boolean;
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

export default function WalletPage() {
  const wallet = useWallet();
  const [offer, setOffer] = useState<ActiveOffer | null>(null);

  useEffect(() => {
    if (!wallet.userId) {
      setOffer(null);
      return;
    }

    const { db } = getFirebase();
    return onSnapshot(doc(db, 'offers', wallet.userId), (snap) => {
      if (!snap.exists()) {
        setOffer(null);
        return;
      }

      const data = snap.data() as {
        bonusCoins?: unknown;
        discountPercent?: unknown;
        packageId?: unknown;
        expiresAt?: unknown;
        active?: unknown;
      };
      const expiresAt =
        data.expiresAt instanceof Timestamp
          ? data.expiresAt.toDate()
          : data.expiresAt instanceof Date
            ? data.expiresAt
            : null;
      const isActive = Boolean(data.active) && Boolean(expiresAt && expiresAt.getTime() > Date.now());
      if (!isActive) {
        setOffer(null);
        return;
      }

      setOffer({
        bonusCoins: typeof data.bonusCoins === 'number' ? data.bonusCoins : 0,
        discountPercent: typeof data.discountPercent === 'number' ? data.discountPercent : undefined,
        packageId: typeof data.packageId === 'string' ? data.packageId : undefined,
        expiresAt: expiresAt!,
        active: true,
      });
    });
  }, [wallet.userId]);

  const offerExpiryText = useMemo(() => {
    if (!offer) return '';
    const msLeft = offer.expiresAt.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000)));
    return `Offer expires in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}`;
  }, [offer]);

  return (
    <main className="min-h-dvh bg-background text-foreground px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="mx-auto w-full max-w-md space-y-5">
        <CoinBalance balance={wallet.coinBalance} loading={!wallet.userId} />

        {offer ? (
          <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 p-4 shadow-sm">
            <p className="text-sm font-bold text-amber-100">🎁 Special Offer for You!</p>
            <p className="mt-1 text-sm text-amber-50">
              Buy any pack and get {offer.bonusCoins} extra coins FREE!
            </p>
            {offer.discountPercent ? (
              <p className="mt-1 text-xs text-amber-100/90">
                Discount: {offer.discountPercent}% off eligible package.
              </p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-amber-100/90">{offerExpiryText}</p>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h1 className="text-lg font-semibold">Top up coins</h1>
            {wallet.error ? (
              <button
                className="text-sm text-destructive underline underline-offset-4"
                onClick={() => wallet.refresh()}
              >
                Retry
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {wallet.loadingPackages
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
                ))
              : wallet.packages.slice(0, 4).map((pkg) => (
                  <CoinPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onSelect={async () => {
                      await wallet.topup(pkg.id, {
                        onSuccess: () => toast.success('Coins added!'),
                        onFailure: (msg) => toast.error(msg),
                      });
                    }}
                  />
                ))}
          </div>
        </section>

        <TransactionHistory
          loading={wallet.loadingTransactions}
          transactions={wallet.transactions}
          emptyMessage="No transactions yet. Top up to get started."
        />
      </div>
    </main>
  );
}

