import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { M3Card, M3CardHeader, M3CardTitle, M3CardDescription, M3CardFooter } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3Avatar } from '@/components/m3/M3Avatar';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { handleAppError } from '@/lib/error-handler';
import '@/styles/m3-theme.css';

export default function Requests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const reqs = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const fromUserDoc = await getDoc(doc(db, 'users', data.fromUid));
          return {
            id: d.id,
            ...data,
            fromUser: fromUserDoc.exists() ? fromUserDoc.data() : { displayName: 'User' }
          };
        }));
        setRequests(reqs);
        setLoading(false);
      } catch (err: any) {
        handleAppError(err, 'Friend requests sync');
        setLoading(false);
      }
    }, (error) => {
      handleAppError(error, 'Friend requests connection');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAction = async (requestId: string, fromUid: string, action: 'accepted' | 'declined') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: action });
      
      if (action === 'accepted') {
        const sortedPair = [user.uid, fromUid].sort();
        const conversationId = sortedPair.join('_');
        const convRef = doc(db, 'conversations', conversationId);
        const existing = await getDoc(convRef);
        if (!existing.exists()) {
          await setDoc(convRef, {
            participants: sortedPair,
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            unreadCount: { [user.uid]: 0, [fromUid]: 0 },
          });
        }
        toast.success('Connection established!');
      } else {
        toast.info('Request declined');
      }
    } catch (err: any) {
      handleAppError(err, 'Updating friend request');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--md-sys-color-primary)]" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 tracking-tight text-[var(--text-primary)] sentence-case">Requests</h1>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-[var(--md-sys-color-surface-variant)]/20 rounded-3xl border-2 border-dashed border-[var(--border-primary)]">
            <p className="font-bold text-[var(--text-primary)] sentence-case">No pending requests</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1 sentence-case">New requests from people wanting to be your friend will show up here.</p>
          </div>
        ) : (
          requests.map((req) => (
            <M3Card key={req.id} variant="elevated" padding="medium">
               <M3CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                  <M3Avatar
                    avatarSeed={req.fromUser.avatarSeed || req.fromUser.id || '?'}
                    size="large"
                  />
                  <div>
                    <M3CardTitle className="text-lg sentence-case">{req.fromUser.displayName}</M3CardTitle>
                    <M3CardDescription className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] sentence-case">
                      Wants to connect
                    </M3CardDescription>
                  </div>
               </M3CardHeader>
               <M3CardFooter className="bg-[var(--md-sys-color-surface-variant)]/30 p-2 gap-2">
                  <M3Button 
                    variant="filled" 
                    className="flex-1 gap-2"
                    onClick={() => handleAction(req.id, req.fromUid, 'accepted')}
                  >
                    <UserCheck className="w-4 h-4" /> Accept
                  </M3Button>
                  <M3Button 
                    variant="outlined" 
                    className="flex-1 gap-2"
                    onClick={() => handleAction(req.id, req.fromUid, 'declined')}
                  >
                    <UserX className="w-4 h-4" /> Decline
                  </M3Button>
               </M3CardFooter>
            </M3Card>
          ))
        )}
      </div>
    </div>
  );
}
