import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export function useUsernameCheck(username: string, currentUsername?: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    if (currentUsername && username === currentUsername) {
      setIsAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('username', '==', username),
          limit(1)
        );
        const snapshot = await getDocs(q);
        setIsAvailable(snapshot.empty);
      } catch (err) {
        console.error('Username check failed:', err);
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, currentUsername]);

  return { isAvailable, checking };
}
