import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isOnboardingComplete: false,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
  
  clearAuth: () => set({ 
    user: null, 
    isLoading: false, 
    isOnboardingComplete: false 
  }),
}));
