import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Payment } from '@/types'

export async function getPayments(): Promise<Payment[]> {
  try {
    const snap = await getDocs(collection(db, 'payments'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment))
  } catch (e) {
    console.error('getPayments error:', e)
    return []
  }
}
