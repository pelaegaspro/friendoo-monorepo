'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  QueryConstraint,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface RealtimeCollectionResult<T> {
  data: T[]
  loading: boolean
  error: Error | null
}

export function useRealtimeCollection<T>(
  collectionPath: string,
  queryConstraints: QueryConstraint[] = []
): RealtimeCollectionResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = query(collection(db, collectionPath), ...queryConstraints)
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
        setData(docs)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath])

  return { data, loading, error }
}
