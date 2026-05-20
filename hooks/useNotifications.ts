import { useState, useEffect } from 'react';
import { notificationService, NotificationItem } from '../services/notificationService';
import { walletService } from '../services/walletService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = walletService.getCurrentUserId();

  useEffect(() => {
    if (!userId) return;

    const unsubItems = notificationService.subscribeToNotifications(userId, (items) => {
      setNotifications(items);
      setLoading(false);
    });

    const unsubCount = notificationService.getUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubItems();
      unsubCount();
    };
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAllRead,
  };
}
