import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  getDocs,
  getFirestore,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
  return { app, auth, db };
}

export type NotificationType =
  | 'friend_request'
  | 'request_accepted'
  | 'new_message'
  | 'daily_prompt'
  | 'support_reply'
  | 'campaign'
  | 'host_approved';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  message?: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
  ticketId?: string;
}

export const notificationService = {
  subscribeToNotifications(userId: string, cb: (items: NotificationItem[]) => void): Unsubscribe {
    const { db } = getFirebase();
    const q = query(
      collection(db, 'notifications', userId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          title: data.title || data.type || 'Notification',
          body: data.body || data.message || '',
          message: data.message,
          read: !!data.read,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          metadata: data.metadata,
          ticketId: typeof data.ticketId === 'string' ? data.ticketId : undefined,
        };
      });
      cb(items);
    });
  },

  async markAllAsRead(userId: string) {
    const { db } = getFirebase();
    const q = query(
      collection(db, 'notifications', userId, 'items'),
      where('read', '==', false)
    );
    
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });

    await batch.commit();
  },

  async getUnreadCount(userId: string, cb: (count: number) => void): Unsubscribe {
    const { db } = getFirebase();
    const q = query(
      collection(db, 'notifications', userId, 'items'),
      where('read', '==', false)
    );

    return onSnapshot(q, (snap) => {
      cb(snap.size);
    });
  }
};
