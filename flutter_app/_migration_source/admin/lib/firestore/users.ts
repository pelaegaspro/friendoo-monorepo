import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { AppUser } from '@/types'

export async function getUsers(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'))
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))
  } catch (e) {
    console.error('getUsers error:', e)
    return []
  }
}

export async function updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>)
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid))
}
