import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { Call } from '@/types'

export function subscribeActiveCalls(
  callback: (calls: Call[]) => void
): Unsubscribe {
  const q = query(collection(db, 'calls'), where('status', '==', 'active'))
  return onSnapshot(q, (snap) => {
    const calls = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Call))
    callback(calls)
  })
}
