'use client';

import { useDiscover } from '../../../hooks/useDiscover';
import { FilterBar } from '../../../components/discover/FilterBar';
import { HostCard } from '../../../components/discover/HostCard';
import { UserCard } from '../../../components/discover/UserCard';
import { useEffect, useRef } from 'react';

export default function DiscoverPage() {
  const {
    users,
    filter,
    loading,
    loadingMore,
    error,
    hasMore,
    handleFilterChange,
    fetchMore,
    retry,
  } = useDiscover();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchMore();
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, hasMore, fetchMore]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 pt-[max(env(safe-area-inset-top),16px)] pb-4 border-b">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>
        <FilterBar activeFilter={filter} onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-[max(env(safe-area-inset-bottom),80px)]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl border bg-card animate-pulse shadow-sm" />
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={retry}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p>No one found nearby. Try a different filter.</p>
          </div>
        ) : (
          <>
            {users.map((user) =>
              user.isHost && user.hostStatus === 'approved' ? (
                <HostCard key={user.id} user={user} />
              ) : (
                <UserCard key={user.id} user={user} />
              )
            )}
            
            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {loadingMore && <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
