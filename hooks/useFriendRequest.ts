import { useState, useEffect, useCallback } from 'react';
import { friendRequestService, FriendRequestStatus } from '../services/friendRequestService';
import { walletService } from '../services/walletService';
import { toast } from 'sonner';

export function useFriendRequest(targetUserId?: string) {
  const [status, setStatus] = useState<FriendRequestStatus>('none');
  const [loadingMap, setLoadingMap] = useState<Map<string, boolean>>(new Map());
  const currentUserId = walletService.getCurrentUserId();

  const setLoading = useCallback((uid: string, isLoading: boolean) => {
    setLoadingMap((prev) => {
      const next = new Map(prev);
      if (isLoading) next.set(uid, true);
      else next.delete(uid);
      return next;
    });
  }, []);

  const fetchStatus = useCallback(async (uid?: string) => {
    const id = uid || targetUserId;
    if (!currentUserId || !id) return;
    try {
      const s = await friendRequestService.getFriendRequestStatus(currentUserId, id);
      if (id === targetUserId) setStatus(s);
      return s;
    } catch (err) {
      console.error('Failed to fetch friend status', err);
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    if (targetUserId) fetchStatus();
  }, [fetchStatus, targetUserId]);

  const sendRequest = async (uid?: string) => {
    const id = uid || targetUserId;
    if (!currentUserId || !id || loadingMap.get(id)) return;
    
    setLoading(id, true);
    const prevStatus = status;
    if (id === targetUserId) setStatus('pending_sent'); // Optimistic
    
    try {
      await friendRequestService.sendFriendRequest(currentUserId, id);
      toast.success('Friend request sent!');
    } catch (err) {
      if (id === targetUserId) setStatus(prevStatus);
      toast.error(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setLoading(id, false);
    }
  };

  const acceptRequest = async (requestId: string, uid?: string) => {
    const id = uid || targetUserId;
    if (!currentUserId || !id || loadingMap.get(id)) return;
    
    setLoading(id, true);
    try {
      await friendRequestService.acceptFriendRequest(requestId, id, currentUserId);
      if (id === targetUserId) setStatus('friends');
      toast.success('Friend request accepted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setLoading(id, false);
    }
  };

  const declineRequest = async (requestId: string, uid?: string) => {
    const id = uid || targetUserId;
    if (!id || loadingMap.get(id)) return;
    
    setLoading(id, true);
    try {
      await friendRequestService.declineFriendRequest(requestId);
      if (id === targetUserId) setStatus('none');
      toast.success('Request declined');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline');
    } finally {
      setLoading(id, false);
    }
  };

  const cancelRequest = async (requestId: string, uid?: string) => {
    const id = uid || targetUserId;
    if (!id || loadingMap.get(id)) return;
    
    setLoading(id, true);
    try {
      await friendRequestService.cancelFriendRequest(requestId);
      if (id === targetUserId) setStatus('none');
      toast.success('Request cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setLoading(id, false);
    }
  };

  return {
    status,
    loadingMap,
    loading: targetUserId ? !!loadingMap.get(targetUserId) : false,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    refreshStatus: fetchStatus,
  };
}
