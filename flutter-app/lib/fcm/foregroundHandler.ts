'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onMessage, isSupported } from 'firebase/messaging';
import { toast } from 'sonner';

function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
  return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
}

export async function initForegroundFCM(navigate: (path: string) => void) {
  if (typeof window === 'undefined') return;
  if (!(await isSupported())) return;

  const app = getFirebaseApp();
  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    const type = data.type;

    if (type === 'incoming_call') {
      const callId = data.callId;
      if (callId) navigate(`/call/incoming/${callId}`);
      return;
    }

    if (type === 'new_message') {
      const title = payload.notification?.title ?? 'New message';
      const body = payload.notification?.body ?? 'You have a new message';
      toast.message(title, { description: body });
    }
  });
}

