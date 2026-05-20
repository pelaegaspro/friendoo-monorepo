import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  arrayUnion,
  arrayRemove,
  getFirestore,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

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
  return { app, db };
}

export const safetyService = {
  async blockUser(uid: string, targetUid: string) {
    const { db } = getFirebase();
    const batch = writeBatch(db);

    // 1. Add to blockedUsers array in user doc
    batch.update(doc(db, 'users', uid), {
      blockedUsers: arrayUnion(targetUid)
    });

    // 2. Create specific block record
    const blockId = [uid, targetUid].sort().join('_');
    batch.set(doc(db, 'blocks', blockId), {
      blockedBy: uid,
      blockedUser: targetUid,
      createdAt: serverTimestamp()
    });

    // 3. Delete friendship if exists
    const friendshipId = [uid, targetUid].sort().join('_');
    batch.delete(doc(db, 'friendships', friendshipId));

    // 4. (Optional) In a real app, you'd also delete messages or hide them
    
    await batch.commit();
  },

  async unblockUser(uid: string, targetUid: string) {
    const { db } = getFirebase();
    const batch = writeBatch(db);

    batch.update(doc(db, 'users', uid), {
      blockedUsers: arrayRemove(targetUid)
    });

    const blockId = [uid, targetUid].sort().join('_');
    batch.delete(doc(db, 'blocks', blockId));

    await batch.commit();
  },

  async reportUser(uid: string, targetUid: string, reason: string, description: string) {
    const { db } = getFirebase();
    
    // 1. Create report doc
    await addDoc(collection(db, 'reports'), {
      reportedBy: uid,
      reportedUser: targetUid,
      reason,
      description,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // 2. Increment report count on target user
    const targetRef = doc(db, 'users', targetUid);
    const snap = await getDoc(targetRef);
    if (snap.exists()) {
      const currentCount = (snap.data().reportCount || 0) + 1;
      await updateDoc(targetRef, {
        reportCount: increment(1)
      });

      // 3. Automated flag if count too high
      if (currentCount >= 5) {
        await updateDoc(targetRef, {
          isFlagged: true,
          tags: arrayUnion('flagged')
        });
        
        await addDoc(collection(db, 'moderationQueue'), {
          userId: targetUid,
          reason: 'Multiple reports',
          createdAt: serverTimestamp()
        });
      }
    }
  },

  async getBlockedUsers(uid: string): Promise<string[]> {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().blockedUsers || []) : [];
  }
};
