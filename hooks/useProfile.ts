import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../store/authStore';
import type { UserProfile } from '../src/types';

export function useProfile(uid: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUid = useAuthStore(state => state.user?.uid);
  const isOwnProfile = currentUid === uid;

  useEffect(() => {
    if (!uid) return;

    setIsLoading(true);

    if (isOwnProfile) {
      // Subscribe to real-time updates for own profile
      const unsubscribe = profileService.subscribeToProfile(uid, (data) => {
        setProfile(data);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Fetch once for other profiles
      profileService.getUserProfile(uid)
        .then(data => {
          setProfile(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [uid, isOwnProfile]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!isOwnProfile || !uid) return;
    await profileService.updateProfile(uid, data);
  }, [uid, isOwnProfile]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!isOwnProfile || !uid) return;
    return await profileService.uploadProfilePhoto(uid, file);
  }, [uid, isOwnProfile]);

  const deletePhoto = useCallback(async (photoUrl: string) => {
    if (!isOwnProfile || !uid) return;
    await profileService.deleteProfilePhoto(uid, photoUrl);
  }, [uid, isOwnProfile]);

  return {
    profile,
    isLoading,
    isOwnProfile,
    updateProfile,
    uploadPhoto,
    deletePhoto
  };
}
