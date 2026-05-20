import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CoinPackage, CoinTransaction } from '../src/types/wallet';
import { walletService } from '../services/walletService';

type WalletState = {
  userId: string | null;
  coinBalance: number;
  packages: CoinPackage[];
  transactions: CoinTransaction[];
  loadingPackages: boolean;
  loadingTransactions: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  topup: (packageId: string, opts: { onSuccess: () => void; onFailure: (msg: string) => void }) => Promise<void>;
};

export function useWallet(): WalletState {
  const [coinBalance, setCoinBalance] = useState(0);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = walletService.getCurrentUserId();

  const refresh = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      setLoadingTransactions(true);
      const txns = await walletService.fetchRecentTransactions(userId);
      setTransactions(txns);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh wallet');
    } finally {
      setLoadingTransactions(false);
    }
  }, [userId]);

  const topup = useCallback(
    async (packageId: string, opts: { onSuccess: () => void; onFailure: (msg: string) => void }) => {
      if (!userId) {
        opts.onFailure('Not signed in');
        return;
      }
      try {
        await walletService.openTopupCheckout({
          packageId,
          userId,
          onSuccess: async () => {
            opts.onSuccess();
            await refresh();
          },
          onFailure: opts.onFailure,
        });
      } catch (e) {
        opts.onFailure(e instanceof Error ? e.message : 'Payment failed');
      }
    },
    [refresh, userId]
  );

  useEffect(() => {
    if (!userId) return;

    const unsubBalance = walletService.subscribeCoinBalance(userId, setCoinBalance);
    return () => unsubBalance();
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setLoadingPackages(true);
      try {
        const pkgs = await walletService.fetchCoinPackages();
        if (mounted) setPackages(pkgs);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load packages');
      } finally {
        if (mounted) setLoadingPackages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoadingTransactions(true);
    const unsub = walletService.subscribeRecentTransactions(userId, (txns) => {
      setTransactions(txns);
      setLoadingTransactions(false);
    });
    return () => unsub();
  }, [userId]);

  return useMemo(
    () => ({
      userId,
      coinBalance,
      packages,
      transactions,
      loadingPackages,
      loadingTransactions,
      error,
      refresh,
      topup,
    }),
    [userId, coinBalance, packages, transactions, loadingPackages, loadingTransactions, error, refresh, topup]
  );
}

