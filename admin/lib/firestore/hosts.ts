import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Host } from '@/types'

export async function getHosts(): Promise<Host[]> {
  try {
    const snap = await getDocs(collection(db, 'hosts'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Host))
  } catch (e) {
    console.error('getHosts error:', e)
    return []
  }
}

export async function updateHost(id: string, data: Partial<Host>): Promise<void> {
  await updateDoc(doc(db, 'hosts', id), data as Record<string, unknown>)
}
