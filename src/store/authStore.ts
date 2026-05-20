import { create } from 'zustand';
import { User } from '@/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { handleAppError } from '@/lib/error-handler';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  init: () => {
    onAuthStateChanged(auth, async (fbUser) => {
      try {
        set({ firebaseUser: fbUser, initialized: true });
        if (fbUser) {
          // Update presence: Online
          const userRef = doc(db, 'users', fbUser.uid);
          
          // Initial fetch
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if ((userData as User & { isBanned?: boolean }).isBanned) {
              await signOut(auth);
              toast.error('Your account has been suspended. Contact support.');
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
              set({ user: null, loading: false });
              return;
            }
            set({ user: userData, loading: false });
            
            // Set online status
            await updateDoc(userRef, { 
              isOnline: true,
              lastActive: new Date().toISOString()
            });
          } else {
            set({ user: null, loading: false });
          }

          // Listen for profile changes (including online status of self)
          onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const nextUser = doc.data() as User & { isBanned?: boolean };
              if (nextUser.isBanned) {
                void signOut(auth);
                toast.error('Your account has been suspended. Contact support.');
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
                set({ user: null });
                return;
              }
              set({ user: nextUser });
            }
          }, (error) => {
            handleAppError(error, 'User profile sync');
          });

        } else {
          set({ user: null, loading: false });
        }
      } catch (err: any) {
        handleAppError(err, 'Authentication initialization');
        set({ loading: false });
      }
    });
  },
}));
