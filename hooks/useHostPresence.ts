import { useEffect, useState } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { doc, getFirestore, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

function getFirebase() {
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
  return { db };
}

export function useHostPresence(uid: string, isHost: boolean) {
  const [isOnline, setIsOnline] = useState(false);

  const goOnline = async () => {
    if (!uid || !isHost) return;
    const { db } = getFirebase();
    await updateDoc(doc(db, 'users', uid), {
      isOnline: true,
      lastActive: serverTimestamp(),
    });
    setIsOnline(true);
    toast.success("You're now Online! Users can call you.");
  };

  const goOffline = async () => {
    if (!uid || !isHost) return;
    const { db } = getFirebase();
    await updateDoc(doc(db, 'users', uid), {
      isOnline: false,
      lastActive: serverTimestamp(),
    });
    setIsOnline(false);
    toast("You're now Offline");
  };

  useEffect(() => {
    if (!uid || !isHost) return;
    const { db } = getFirebase();
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setIsOnline(Boolean(snap.data()?.isOnline));
    });
    return unsub;
  }, [uid, isHost]);

  useEffect(() => {
    if (!uid || !isHost) return;
    const { db } = getFirebase();
    const handleUnload = () => {
      void updateDoc(doc(db, 'users', uid), { isOnline: false });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [uid, isHost]);

  return { isOnline, goOnline, goOffline };
}
