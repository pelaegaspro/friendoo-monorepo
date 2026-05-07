import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Host } from '@/types'

export function useHostFeed(languageFilter?: string) {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = query(
      collection(db, 'hosts'),
      where('hostStatus', '==', 'approved'),
      where('isHost', '==', true),
      orderBy('rating', 'desc'),
      limit(50),
    )

    if (languageFilter) {
      q = query(
        collection(db, 'hosts'),
        where('hostStatus', '==', 'approved'),
        where('isHost', '==', true),
        where('languages', 'array-contains', languageFilter),
        orderBy('rating', 'desc'),
        limit(50),
      )
    }

    const unsub = onSnapshot(q, (snap) => {
      setHosts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Host, 'id'>),
        })),
      )
      setLoading(false)
    })

    return unsub
  }, [languageFilter])

  return { hosts, loading }
}
