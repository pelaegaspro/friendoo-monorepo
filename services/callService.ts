import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { CallDoc, CallStatus } from '../src/types/calls';

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

export const callService = {
  async createCall(callerId: string, receiverId: string, ratePerMinute: number) {
    const { db } = getFirebase();

    if (!callerId) throw new Error('Missing callerId');
    if (!receiverId) throw new Error('Missing receiverId');
    if (!Number.isFinite(ratePerMinute) || ratePerMinute <= 0) throw new Error('Invalid ratePerMinute');

    const userSnap = await getDoc(doc(db, 'users', callerId));
    const coinBalance = typeof userSnap.data()?.coinBalance === 'number' ? userSnap.data()!.coinBalance : 0;
    const configSnap = await getDoc(doc(db, 'config', 'appSettings'));
    const minCoins = typeof configSnap.data()?.minCallCoins === 'number' ? configSnap.data()!.minCallCoins : 15;

    if (coinBalance < minCoins) {
      throw new Error('INSUFFICIENT_COINS');
    }

    const ref = await addDoc(collection(db, 'calls'), {
      callerId,
      receiverId,
      fromUserId: callerId,
      toUserId: receiverId,
      status: 'ringing' satisfies CallStatus,
      callType: 'audio',
      createdAt: serverTimestamp(),
      ringingAt: serverTimestamp(),
      ratePerMinute,
      coinsSpent: 0,
      anonymous: true,
      agoraChannel: '',
    });

    // Optional: store id in doc for convenience
    await updateDoc(ref, { id: ref.id });

    return ref.id;
  },

  async endCall(callId: string) {
    const { db } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    await updateDoc(doc(db, 'calls', callId), { status: 'ended' satisfies CallStatus, endedAt: serverTimestamp() });
  },

  async acceptCall(callId: string) {
    const { db, auth } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    await updateDoc(doc(db, 'calls', callId), { status: 'active' satisfies CallStatus, acceptedAt: serverTimestamp() });
    
    // Increment callsToday for host
    const uid = auth.currentUser?.uid;
    if (uid) {
      const { increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'hosts', uid), {
        callsToday: increment(1)
      }).catch(err => console.warn('Failed to update host callsToday', err));
    }
  },

  async declineCall(callId: string) {
    const { db, auth } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    await updateDoc(doc(db, 'calls', callId), { status: 'rejected' satisfies CallStatus, endedAt: serverTimestamp() });

    // Increment declinedToday for host
    const uid = auth.currentUser?.uid;
    if (uid) {
      const { increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'hosts', uid), {
        declinedToday: increment(1)
      }).catch(err => console.warn('Failed to update host declinedToday', err));
    }
  },

  async markMissed(callId: string) {
    const { db } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    await updateDoc(doc(db, 'calls', callId), { status: 'missed' satisfies CallStatus, endedAt: serverTimestamp() });
  },

  async getCallDoc(callId: string): Promise<CallDoc> {
    const { db } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    const snap = await getDoc(doc(db, 'calls', callId));
    if (!snap.exists()) throw new Error('Call not found');
    return { id: snap.id, ...(snap.data() as Omit<CallDoc, 'id'>) };
  },

  subscribeToCall(callId: string, cb: (call: CallDoc | null) => void): Unsubscribe {
    const { db } = getFirebase();
    if (!callId) {
      cb(null);
      return () => {};
    }
    return onSnapshot(
      doc(db, 'calls', callId),
      (snap) => {
        if (!snap.exists()) return cb(null);
        cb({ id: snap.id, ...(snap.data() as Omit<CallDoc, 'id'>) });
      },
      (err) => {
        console.error('subscribeToCall failed', err);
        cb(null);
      }
    );
  },

  getCurrentUserId() {
    const { auth } = getFirebase();
    return auth.currentUser?.uid ?? null;
  },

  async getAgoraToken(callId: string): Promise<{ appId: string; token: string; channel: string }> {
    const { functions } = getFirebase();
    if (!callId) throw new Error('Missing callId');
    // Stub call: implement Cloud Function separately later.
    const callable = httpsCallable(functions, 'getAgoraToken');
    const result = await callable({ callId });
    const data = result.data as unknown;
    const appId = (data as { appId?: unknown }).appId;
    const token = (data as { token?: unknown }).token;
    const channel = (data as { channel?: unknown }).channel;
    if (typeof appId !== 'string' || typeof token !== 'string' || typeof channel !== 'string') {
      throw new Error('Invalid Agora token response');
    }
    return { appId, token, channel };
  },
};
