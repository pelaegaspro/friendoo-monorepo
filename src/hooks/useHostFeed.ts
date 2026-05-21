import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Host } from '@/types'

// Global in-memory cache to hold the last fetched host feeds by language/category.
// This implements a high-performance Stale-While-Revalidate (SWR) design pattern.
const globalHostCache: Record<string, Host[]> = {}

export function useHostFeed(languageFilter?: string) {
  const cacheKey = languageFilter || 'All'
  
  // Initialize state with cached data if it exists.
  // This allows the UI to render the host feed in 0 milliseconds on mount or filter switch!
  const [hosts, setHosts] = useState<Host[]>(() => globalHostCache[cacheKey] || [])
  
  // If we have cached hosts, we don't block the screen with a skeleton layout.
  // We only set loading to true if there is no cache available yet.
  const [loading, setLoading] = useState(() => !globalHostCache[cacheKey] || globalHostCache[cacheKey].length === 0)

  useEffect(() => {
    // If the cache key changes and we have cached data, update state immediately.
    // This handles the transition when languageFilter updates.
    if (globalHostCache[cacheKey] && globalHostCache[cacheKey].length > 0) {
      setHosts(globalHostCache[cacheKey])
      setLoading(false)
    } else {
      setLoading(true)
    }

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
      const fetchedHosts = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Host, 'id'>),
      }))
      
      // Update global in-memory cache and local state simultaneously
      globalHostCache[cacheKey] = fetchedHosts
      setHosts(fetchedHosts)
      setLoading(false)
    }, (error) => {
      console.error('Failed to sync hosts feed:', error)
      setLoading(false)
    })

    return unsub
  }, [languageFilter, cacheKey])

  return { hosts, loading }
}
