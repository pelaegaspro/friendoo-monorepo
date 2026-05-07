import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useCoinBalance(uid: string | undefined) {
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        setBalance((snap.data().coinBalance as number) ?? 0)
      }
    })
    return unsub
  }, [uid])

  return balance
}
