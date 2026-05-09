import { collection, getDocs, where, query, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import type { CoinPack } from '@/types'

export async function listActiveCoinPacks(): Promise<CoinPack[]> {
  const snap = await getDocs(
    query(collection(db, 'coinPacks'), where('active', '==', true), limit(20)),
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CoinPack, 'id'>),
  }))
}

export async function createPaymentOrder(
  amount: number,
): Promise<{ orderId: string; paymentSessionId: string }> {
  const fn = httpsCallable<
    { amount: number },
    { orderId: string; paymentSessionId: string }
  >(functions, 'createCashfreeOrder')
  const result = await fn({ amount })
  return result.data
}

export async function verifyAndRechargeWallet(
  userId: string,
  paymentId: string,
): Promise<{ success: boolean; coinsAdded?: number }> {
  const fn = httpsCallable<
    { userId: string; paymentId: string },
    { success: boolean; coinsAdded?: number }
  >(functions, 'rechargeWallet')
  const result = await fn({ userId, paymentId })
  return result.data
}

export function coinsForPack(pack: CoinPack): number {
  return pack.coins + (pack.bonus ?? 0)
}

