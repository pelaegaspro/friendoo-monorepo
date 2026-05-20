import { collection, getDocs, where, query, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import type { CoinPack } from '@/types'

export async function listActiveCoinPacks(): Promise<CoinPack[]> {
  const snap = await getDocs(
    query(collection(db, 'coinPackages'), where('active', '==', true), limit(20)),
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CoinPack, 'id'>),
  }))
}

export async function createPaymentOrder(
  packageId: string,
): Promise<{ orderId: string; paymentSessionId: string; coins: number }> {
  const fn = httpsCallable<
    { packageId: string },
    { orderId: string; paymentSessionId: string; coins: number }
  >(functions, 'createCashfreeOrder')
  const result = await fn({ packageId })
  return result.data
}

export function coinsForPack(pack: CoinPack): number {
  return pack.coins + (pack.bonus ?? 0)
}
