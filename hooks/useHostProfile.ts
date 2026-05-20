import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';

export function useHostProfile(uid: string) {
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    setIsLoading(true);
    const unsubscribe = profileService.subscribeToHost(uid, (data) => {
      setHostProfile(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const toggleOnline = async () => {
    if (!uid || !hostProfile) return;
    const newStatus = !hostProfile.isOnline;
    
    // Strict check for declined calls
    if (newStatus === true && hostProfile.declinedToday >= 5) {
      throw new Error('Daily decline limit reached. You cannot go online.');
    }

    try {
      await profileService.updateOnlineStatus(uid, newStatus);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  return {
    hostProfile,
    isLoading,
    toggleOnline
  };
}
