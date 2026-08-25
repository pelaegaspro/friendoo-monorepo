import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Booking } from '@/types'

export async function getBookings(): Promise<Booking[]> {
  try {
    const snap = await getDocs(collection(db, 'bookings'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking))
  } catch (e) {
    console.error('getBookings error:', e)
    return []
  }
}

export async function updateBooking(id: string, data: Partial<Booking>): Promise<void> {
  await updateDoc(doc(db, 'bookings', id), data as Record<string, unknown>)
}
