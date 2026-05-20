import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  getFirestore,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { getFunctions, httpsCallable } from 'firebase/functions';

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
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, 'asia-south1');
  return { app, auth, db, functions };
}

export type FriendRequestStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

export const friendRequestService = {
  async sendFriendRequest(fromUid: string, toUid: string) {
    const { db } = getFirebase();

    // 1. Check existing status
    const status = await this.getFriendRequestStatus(fromUid, toUid);
    if (status !== 'none') throw new Error(`Cannot send request: Current status is ${status}`);

    // 2. Fetch shared interests (optional optimization)
    const [fromSnap, toSnap] = await Promise.all([
      getDoc(doc(db, 'users', fromUid)),
      getDoc(doc(db, 'users', toUid)),
    ]);
    const fromInterests = fromSnap.data()?.interests || [];
    const toInterests = toSnap.data()?.interests || [];
    const sharedInterests = fromInterests.filter((i: string) => toInterests.includes(i));

    // 3. Create request
    await addDoc(collection(db, 'friendRequests'), {
      from: fromUid,
      to: toUid,
      status: 'pending',
      createdAt: serverTimestamp(),
      sharedInterests,
    });

    // 4. Send FCM notification via callable
    try {
      const { functions } = getFirebase();
      const sendNotification = httpsCallable(functions, 'sendFriendRequestNotification');
      await sendNotification({ toUid, fromUid, sharedInterests });
    } catch (e) {
      console.error('Failed to send FCM notification', e);
    }
  },

  async acceptFriendRequest(requestId: string, fromUid: string, toUid: string) {
    const { db } = getFirebase();
    const sortedIds = [fromUid, toUid].sort();
    const friendshipId = sortedIds.join('_');

    await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, 'friendRequests', requestId);
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const user1Ref = doc(db, 'users', fromUid);
      const user2Ref = doc(db, 'users', toUid);

      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) throw new Error('Request not found');

      transaction.update(requestRef, { status: 'accepted' });
      transaction.set(friendshipRef, {
        users: sortedIds,
        createdAt: serverTimestamp(),
        sharedInterests: requestSnap.data()?.sharedInterests || [],
      });
      
      const u1Snap = await transaction.get(user1Ref);
      const u2Snap = await transaction.get(user2Ref);
      
      transaction.update(user1Ref, { friendCount: (u1Snap.data()?.friendCount || 0) + 1 });
      transaction.update(user2Ref, { friendCount: (u2Snap.data()?.friendCount || 0) + 1 });
    });
  },

  async declineFriendRequest(requestId: string) {
    const { db } = getFirebase();
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  },

  async cancelFriendRequest(requestId: string) {
    const { db } = getFirebase();
    await deleteDoc(doc(db, 'friendRequests', requestId));
  },

  async getFriendRequestStatus(fromUid: string, toUid: string): Promise<FriendRequestStatus> {
    const { db } = getFirebase();

    // Check friendships
    const sortedIds = [fromUid, toUid].sort();
    const friendshipSnap = await getDoc(doc(db, 'friendships', sortedIds.join('_')));
    if (friendshipSnap.exists()) return 'friends';

    // Check blocked
    const userSnap = await getDoc(doc(db, 'users', fromUid));
    const blockedUsers = userSnap.data()?.blockedUsers || [];
    if (blockedUsers.includes(toUid)) return 'blocked';

    // Check pending requests
    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', fromUid),
      where('to', '==', toUid),
      where('status', '==', 'pending')
    );
    const sentSnap = await getDocs(sentQuery);
    if (!sentSnap.empty) return 'pending_sent';

    const receivedQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', toUid),
      where('to', '==', fromUid),
      where('status', '==', 'pending')
    );
    const receivedSnap = await getDocs(receivedQuery);
    if (!receivedSnap.empty) return 'pending_received';

    return 'none';
  },
};
