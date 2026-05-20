'use client';

import { useEffect } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationItem } from '../../../components/notifications/NotificationItem';

export default function NotificationsPage() {
  const { notifications, loading, markAllRead } = useNotifications();

  useEffect(() => {
    // Mark as read when screen is opened
    const timer = setTimeout(() => {
      markAllRead();
    }, 2000); // Small delay before marking all as read

    return () => clearTimeout(timer);
  }, [markAllRead]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 pt-[max(env(safe-area-inset-top),16px)] pb-4 border-b">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-[max(env(safe-area-inset-bottom),80px)]">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border bg-card animate-pulse shadow-sm" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground">Check back later for updates.</p>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem key={item.id} notification={item} />
          ))
        )}
      </main>
    </div>
  );
}
