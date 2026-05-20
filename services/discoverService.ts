import {
  collection,
  query,
  where,
  limit,
  getDocs,
  getFirestore,
  QueryDocumentSnapshot,
  startAfter,
  doc,
  getDoc,
  DocumentData,
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

export type DiscoverFilter = 'All' | '18-25' | '25-35' | '35+' | 'Hindi' | '🟢 Online';

export interface DiscoverUser {
  id: string;
  displayName: string;
  username?: string;
  city?: string;
  bio?: string;
  age?: number;
  isHost?: boolean;
  hostStatus?: 'approved' | 'pending' | 'suspended' | 'none';
  isOnline?: boolean;
  ratePerMinute?: number;
  photoURL?: string;
  photos?: string[];
  languages?: string[];
  interests?: string[];
  compatibilityScore?: number;
  lastSeen?: Date;
  anonymousModeEnabled?: boolean;
  aiAvatarId?: string;
}

function mapDiscoverUser(id: string, data: Record<string, unknown>): DiscoverUser {
  const photos = Array.isArray(data.photos)
    ? data.photos.filter((value): value is string => typeof value === 'string')
    : [];

  return {
    id,
    displayName: (data.displayName as string | null | undefined) ?? 'Friendoo Host',
    username: (data.username as string | null | undefined) ?? '',
    city: (data.city as string | null | undefined) ?? '',
    bio: (data.bio as string | null | undefined) ?? '',
    age: typeof data.age === 'number' ? data.age : undefined,
    isHost: typeof data.isHost === 'boolean' ? data.isHost : false,
    hostStatus:
      data.hostStatus === 'approved' || data.hostStatus === 'pending' || data.hostStatus === 'suspended'
        ? data.hostStatus
        : 'none',
    isOnline:
      typeof data.isOnline === 'boolean'
        ? data.isOnline
        : typeof data.onlineStatus === 'boolean'
          ? data.onlineStatus
          : false,
    ratePerMinute:
      typeof data.ratePerMinute === 'number'
        ? data.ratePerMinute
        : typeof data.coinsPerMinute === 'number'
          ? data.coinsPerMinute
          : 20,
    photoURL:
      (data.photoURL as string | null | undefined) ??
      photos[0] ??
      '',
    photos,
    languages: Array.isArray(data.languages)
      ? data.languages.filter((value): value is string => typeof value === 'string')
      : [],
    interests: Array.isArray(data.interests)
      ? data.interests.filter((value): value is string => typeof value === 'string')
      : [],
    compatibilityScore:
      typeof data.compatibilityScore === 'number' ? data.compatibilityScore : undefined,
    lastSeen:
      typeof (data.lastSeen as { toDate?: unknown } | undefined)?.toDate === 'function'
        ? ((data.lastSeen as { toDate: () => Date }).toDate())
        : typeof data.lastActive === 'string'
          ? new Date(data.lastActive)
        : undefined,
    anonymousModeEnabled:
      typeof data.anonymousModeEnabled === 'boolean' ? data.anonymousModeEnabled : false,
    aiAvatarId: (data.aiAvatarId as string | null | undefined) ?? undefined,
  };
}

function applyClientFilter(users: DiscoverUser[], filter: DiscoverFilter) {
  switch (filter) {
    case '18-25':
      return users.filter((user) => typeof user.age === 'number' && user.age >= 18 && user.age <= 25);
    case '25-35':
      return users.filter((user) => typeof user.age === 'number' && user.age > 25 && user.age <= 35);
    case '35+':
      return users.filter((user) => typeof user.age === 'number' && user.age > 35);
    case 'Hindi':
      return users.filter((user) => user.languages?.includes('Hindi'));
    default:
      return users;
  }
}

function sortDiscoverUsers(users: DiscoverUser[]) {
  return [...users].sort((left, right) => {
    const onlineDelta = Number(Boolean(right.isOnline)) - Number(Boolean(left.isOnline));
    if (onlineDelta !== 0) return onlineDelta;
    const leftSeen = left.lastSeen?.getTime() ?? 0;
    const rightSeen = right.lastSeen?.getTime() ?? 0;
    return rightSeen - leftSeen;
  });
}

export const discoverService = {
  async fetchDiscoverFeed(userId: string, filter: DiscoverFilter) {
    const { db } = getFirebase();
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data();

    const blockedUsers: string[] = userData?.blockedUsers || [];
    const blockedBy: string[] = userData?.blockedBy || [];

    const excludedUsers = [userId, ...blockedUsers, ...blockedBy];

    const usersRef = collection(db, 'users');
    let q =
      filter === '🟢 Online'
        ? query(usersRef, where('isHost', '==', true), where('isOnline', '==', true), limit(50))
        : query(usersRef, where('isHost', '==', true), limit(50));

    const snapshot = await getDocs(q);
    const results: DiscoverUser[] = [];
    let lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null = null;

    for (const doc of snapshot.docs) {
      if (!excludedUsers.includes(doc.id)) {
        const data = doc.data() as Record<string, unknown>;
        const mapped = mapDiscoverUser(doc.id, data);
        if (mapped.hostStatus === 'suspended') continue;
        results.push(mapped);
        lastVisible = doc;
      }
    }
    const filteredResults = sortDiscoverUsers(applyClientFilter(results, filter)).slice(0, 20);

    return { users: filteredResults, nextCursor: lastVisible };
  },

  async fetchMoreUsers(
    userId: string,
    filter: DiscoverFilter,
    cursor: QueryDocumentSnapshot<DocumentData, DocumentData>
  ) {
    const { db } = getFirebase();
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data();

    const blockedUsers: string[] = userData?.blockedUsers || [];
    const blockedBy: string[] = userData?.blockedBy || [];

    const excludedUsers = [userId, ...blockedUsers, ...blockedBy];

    const usersRef = collection(db, 'users');
    let q =
      filter === '🟢 Online'
        ? query(
            usersRef,
            where('isHost', '==', true),
            where('isOnline', '==', true),
            startAfter(cursor),
            limit(50)
          )
        : query(usersRef, where('isHost', '==', true), startAfter(cursor), limit(50));

    const snapshot = await getDocs(q);
    const results: DiscoverUser[] = [];
    let lastVisible: QueryDocumentSnapshot<DocumentData, DocumentData> | null = null;

    for (const doc of snapshot.docs) {
      if (!excludedUsers.includes(doc.id)) {
        const data = doc.data() as Record<string, unknown>;
        const mapped = mapDiscoverUser(doc.id, data);
        if (mapped.hostStatus === 'suspended') continue;
        results.push(mapped);
        lastVisible = doc;
      }
    }
    const filteredResults = sortDiscoverUsers(applyClientFilter(results, filter)).slice(0, 20);

    return { users: filteredResults, nextCursor: lastVisible };
  },
};
