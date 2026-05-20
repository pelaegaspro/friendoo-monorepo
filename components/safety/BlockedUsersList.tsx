'use client';

import { useState, useEffect } from 'react';
import { safetyService } from '../../services/safetyService';
import { useAuthStore } from '../../store/authStore';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import { Button } from '../../src/components/ui/button';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { Skeleton } from '../../src/components/ui/skeleton';
import { toast } from 'sonner';

export function BlockedUsersList() {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUid = useAuthStore(state => state.user?.uid);

  const fetchBlockedUsers = async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const ids = await safetyService.getBlockedUsers(currentUid);
      setBlockedIds(ids);
      
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };
      const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
      const db = getFirestore(app);

      const users = await Promise.all(ids.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
      }));

      setBlockedUsers(users.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch blocked users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [currentUid]);

  const handleUnblock = async (targetUid: string) => {
    if (!currentUid) return;
    try {
      await safetyService.unblockUser(currentUid, targetUid);
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch (err) {
      toast.error('Failed to unblock. Try again.');
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-900 animate-pulse" />)}
    </div>
  );

  if (blockedUsers.length === 0) return (
    <div className="p-10 text-center bg-zinc-900/30 rounded-[2rem] border-2 border-dashed border-zinc-900">
      <div className="p-3 bg-zinc-900 rounded-2xl w-fit mx-auto mb-3">
        <CheckCircle2 className="h-6 w-6 text-zinc-700" />
      </div>
      <p className="text-xs text-zinc-600 font-black uppercase tracking-widest">No blocked users</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {blockedUsers.map(user => (
        <div 
          key={user.uid} 
          className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-900 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <DiceBearAvatar seed={user.uid || user.displayName || 'user'} size={44} />
            <div>
              <p className="font-bold text-sm text-zinc-200">{user.displayName}</p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">@{user.username}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-purple-400 font-black uppercase text-[10px] tracking-widest hover:bg-purple-500/10 hover:text-purple-400"
            onClick={() => handleUnblock(user.uid)}
          >
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
}

// Stub for CheckCircle2 if needed
function CheckCircle2(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  )
}
