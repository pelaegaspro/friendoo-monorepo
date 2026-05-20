import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import type { Call } from '@/types'

export async function requestCall(userId: string, hostId: string): Promise<{ callId: string; channel: string }> {
  const hostSnap = await getDoc(doc(db, 'hosts', hostId))
  if (!hostSnap.exists()) throw new Error('Host not found')
  const hostData = hostSnap.data()
  if (hostData.callStatus !== 'available') throw new Error('Host is not available')

  const channel = `call_${userId.slice(0, 6)}_${hostId.slice(0, 6)}_${Date.now()}`
  const ref = await addDoc(collection(db, 'calls'), {
    callerId: userId,
    receiverId: hostId,
    fromUserId: userId,
    toUserId: hostId,
    status: 'ringing',
    callType: 'audio',
    agoraChannel: channel,
    ratePerMinute: hostData.ratePerMinute ?? 5,
    coinsSpent: 0,
    anonymous: true,
    createdAt: serverTimestamp(),
    ringingAt: serverTimestamp(),
  })
  await updateDoc(ref, { agoraChannel: ref.id })
  return { callId: ref.id, channel: ref.id }
}

export async function endCall(callId: string, durationSeconds: number, coinsSpent: number): Promise<void> {
  await updateDoc(doc(db, 'calls', callId), {
    status: 'ended',
    durationSeconds,
    coinsSpent,
    endedAt: serverTimestamp(),
  })
}

export async function getAgoraToken(callId: string): Promise<{ token: string; appId: string; channel: string }> {
  const fn = httpsCallable<{ callId: string }, { token: string; appId: string; channel: string }>(
    functions,
    'getAgoraToken',
  )
  const result = await fn({ callId })
  return result.data
}

export function callFromDoc(id: string, data: Record<string, unknown>): Call {
  return {
    id,
    fromUserId: (data.fromUserId as string) ?? '',
    hostId: (data.hostId as string) ?? '',
    status: (data.status as Call['status']) ?? 'ended',
    agoraChannel: (data.agoraChannel as string) ?? '',
    ratePerMinute: (data.ratePerMinute as number) ?? 5,
    coinsSpent: (data.coinsSpent as number) ?? 0,
    durationSeconds: (data.durationSeconds as number) ?? 0,
    createdAt: data.createdAt ? (data.createdAt as { toDate(): Date }).toDate().toISOString() : null,
    acceptedAt: data.acceptedAt ? (data.acceptedAt as { toDate(): Date }).toDate().toISOString() : null,
    endedAt: data.endedAt ? (data.endedAt as { toDate(): Date }).toDate().toISOString() : null,
  }
}
