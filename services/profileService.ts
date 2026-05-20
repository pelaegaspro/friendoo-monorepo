import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  getFirestore,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getApps, initializeApp } from 'firebase/app';
import type { UserProfile } from '../src/types';

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
  const storage = getStorage(app);
  return { app, db, storage };
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((item): item is string => typeof item === 'string');
}

function mapUserProfile(uid: string, raw: Record<string, unknown>): UserProfile {
  const photos = asStringArray(raw.photos);
  const primaryPhoto = asString(raw.photoURL) || photos[0] || '';

  return {
    uid,
    displayName: asString(raw.displayName, 'Friendoo Host'),
    username: asString(raw.username),
    gender: raw.gender as UserProfile['gender'],
    age: typeof raw.age === 'number' ? raw.age : undefined,
    city: asString(raw.city),
    bio: asString(raw.bio),
    interests: asStringArray(raw.interests),
    languages: asStringArray(raw.languages),
    onboarded: Boolean(raw.onboarded ?? raw.onboardingComplete),
    guidelinesAccepted: typeof raw.guidelinesAccepted === 'boolean' ? raw.guidelinesAccepted : undefined,
    friendshipIntent: asString(raw.friendshipIntent),
    preferredChatModes: Array.isArray(raw.preferredChatModes)
      ? raw.preferredChatModes.filter(
          (mode): mode is 'text' | 'voice' => mode === 'text' || mode === 'voice'
        )
      : undefined,
    trustScore: typeof raw.trustScore === 'number' ? raw.trustScore : undefined,
    profileCompleteness:
      typeof raw.profileCompleteness === 'number' ? raw.profileCompleteness : undefined,
    isOnline: typeof raw.isOnline === 'boolean' ? raw.isOnline : Boolean(raw.onlineStatus),
    onlineStatus:
      typeof raw.isOnline === 'boolean' ? raw.isOnline : Boolean(raw.onlineStatus),
    isHost: Boolean(raw.isHost),
    hostStatus:
      raw.hostStatus === 'approved' || raw.hostStatus === 'pending' || raw.hostStatus === 'suspended'
        ? raw.hostStatus
        : undefined,
    ratePerMinute: typeof raw.ratePerMinute === 'number'
      ? raw.ratePerMinute
      : typeof raw.coinsPerMinute === 'number'
        ? raw.coinsPerMinute
        : 20,
    photoURL: primaryPhoto,
    photos,
    phoneNumber: asString(raw.phoneNumber || raw.phone),
    coinBalance: typeof raw.coinBalance === 'number' ? raw.coinBalance : 0,
    anonymousModeEnabled:
      typeof raw.anonymousModeEnabled === 'boolean' ? raw.anonymousModeEnabled : false,
    lastActive: asString(raw.lastActive),
    lastSeen: raw.lastSeen ?? raw.lastActive ?? undefined,
    createdAt: asString(raw.createdAt),
    totalCalls: typeof raw.totalCalls === 'number' ? raw.totalCalls : undefined,
    rating: typeof raw.rating === 'number' ? raw.rating : 4.8,
  };
}

function mapHostProfile(uid: string, raw: Record<string, unknown>) {
  return {
    uid,
    isOnline: typeof raw.isOnline === 'boolean' ? raw.isOnline : false,
    callStatus: (raw.callStatus as any) || 'offline',
    todayEarnings: typeof raw.todayEarnings === 'number' ? raw.todayEarnings : 0,
    callsToday: typeof raw.callsToday === 'number' ? raw.callsToday : 0,
    declinedToday: typeof raw.declinedToday === 'number' ? raw.declinedToday : 0,
    minutesToday: typeof raw.minutesToday === 'number' ? raw.minutesToday : 0,
    totalEarnings: typeof raw.totalEarnings === 'number' ? raw.totalEarnings : 0,
    performanceScore: typeof raw.performanceScore === 'number' ? raw.performanceScore : 0,
    rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
    followers: typeof raw.followers === 'number' ? raw.followers : 0,
  };
}

export const profileService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? mapUserProfile(snap.id, snap.data() as Record<string, unknown>) : null;
  },

  subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const { db } = getFirebase();
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      callback(
        snap.exists() ? mapUserProfile(snap.id, snap.data() as Record<string, unknown>) : null
      );
    });
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    const { db } = getFirebase();
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async uploadProfilePhoto(uid: string, file: File) {
    const { db, storage } = getFirebase();
    const timestamp = Date.now();
    const storagePath = `profile-photos/${uid}/${timestamp}_${file.name}`;
    const fileRef = ref(storage, storagePath);

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    await updateDoc(doc(db, 'users', uid), {
      photos: arrayUnion(downloadURL),
      photoURL: downloadURL, // Set main photo as the latest upload
      updatedAt: serverTimestamp(),
    });

    return downloadURL;
  },

  async deleteProfilePhoto(uid: string, photoUrl: string) {
    const { db, storage } = getFirebase();
    
    // 1. Delete from Storage
    try {
      const fileRef = ref(storage, photoUrl);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn('Failed to delete photo from storage, might already be gone', err);
    }

    // 2. Remove from Firestore
    await updateDoc(doc(db, 'users', uid), {
      photos: arrayRemove(photoUrl),
      updatedAt: serverTimestamp(),
    });
  },

  async updateOnlineStatus(uid: string, isOnline: boolean) {
    const { db } = getFirebase();
    const batch = [];
    
    // Update user doc
    await updateDoc(doc(db, 'users', uid), {
      isOnline,
      onlineStatus: isOnline,
      lastSeen: serverTimestamp(),
    });

    // Update host doc
    await updateDoc(doc(db, 'hosts', uid), {
      isOnline,
      callStatus: isOnline ? 'available' : 'offline',
      updatedAt: serverTimestamp(),
    });
  },

  async getHostProfile(uid: string) {
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'hosts', uid));
    return snap.exists() ? mapHostProfile(snap.id, snap.data() as Record<string, unknown>) : null;
  },

  subscribeToHost(uid: string, callback: (data: any) => void) {
    const { db } = getFirebase();
    return onSnapshot(doc(db, 'hosts', uid), (snap) => {
      callback(
        snap.exists() ? mapHostProfile(snap.id, snap.data() as Record<string, unknown>) : null
      );
    });
  },

  async updateHostProfile(uid: string, data: any) {
    const { db } = getFirebase();
    await updateDoc(doc(db, 'hosts', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
};
