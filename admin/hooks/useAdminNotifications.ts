'use client'

import { useEffect, useState } from 'react'
import {
  collection, query, where, onSnapshot, Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useAdminNotifications(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let openReports = 0
    let newUsers = 0

    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)
    const yesterdayTs = Timestamp.fromDate(yesterday)

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), where('status', '==', 'open')),
      (snap) => {
        openReports = snap.size
        setCount(openReports + newUsers)
      }
    )

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('createdAt', '>=', yesterdayTs)),
      (snap) => {
        newUsers = snap.size
        setCount(openReports + newUsers)
      }
    )

    return () => {
      unsubReports()
      unsubUsers()
    }
  }, [])

  return count
}
