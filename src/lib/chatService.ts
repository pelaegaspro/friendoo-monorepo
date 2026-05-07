import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Chat, ChatMessage } from '@/types'

export async function getOrCreateChat(userId: string, hostId: string): Promise<string> {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
  )
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    const data = d.data()
    if ((data.participants as string[]).includes(hostId)) return d.id
  }

  const ref = doc(collection(db, 'chats'))
  await setDoc(ref, {
    participants: [userId, hostId],
    hostId,
    userId,
    lastMessage: '',
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId)
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    type: 'text',
    createdAt: serverTimestamp(),
    readAt: null,
  })
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  })
}

export function subscribeMessages(
  chatId: string,
  callback: (msgs: ChatMessage[]) => void,
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100),
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        chatId,
        senderId: (d.data().senderId as string) ?? '',
        text: (d.data().text as string) ?? '',
        type: (d.data().type as ChatMessage['type']) ?? 'text',
        createdAt: d.data().createdAt ? (d.data().createdAt as { toDate(): Date }).toDate().toISOString() : null,
        readAt: d.data().readAt ? (d.data().readAt as { toDate(): Date }).toDate().toISOString() : null,
      })),
    )
  })
}

export function subscribeChats(userId: string, callback: (chats: Chat[]) => void): () => void {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
    limit(30),
  )
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Chat, 'id'>),
      })),
    )
  })
}
