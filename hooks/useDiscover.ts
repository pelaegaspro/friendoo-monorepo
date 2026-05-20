import { useState, useEffect, useCallback, useRef } from 'react';
import { discoverService, DiscoverFilter, DiscoverUser } from '../services/discoverService';
import { walletService } from '../services/walletService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export function useDiscover() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [filter, setFilter] = useState<DiscoverFilter>('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const userId = walletService.getCurrentUserId();

  const fetchInitial = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { users: initialUsers, nextCursor: cursor } = await discoverService.fetchDiscoverFeed(userId, filter);
      setUsers(initialUsers);
      setNextCursor(cursor);
      setHasMore(initialUsers.length === 20); // If we got 20, there's probably more
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  const fetchMore = useCallback(async () => {
    if (!userId || !nextCursor || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { users: moreUsers, nextCursor: cursor } = await discoverService.fetchMoreUsers(userId, filter, nextCursor);
      setUsers((prev) => [...prev, ...moreUsers]);
      setNextCursor(cursor);
      setHasMore(moreUsers.length === 20);
    } catch (err) {
      console.error('Fetch more failed', err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, filter, nextCursor, loadingMore, hasMore]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const handleFilterChange = (newFilter: DiscoverFilter) => {
    setFilter(newFilter);
  };

  return {
    users,
    filter,
    loading,
    loadingMore,
    error,
    hasMore,
    handleFilterChange,
    fetchMore,
    retry: fetchInitial,
  };
}
