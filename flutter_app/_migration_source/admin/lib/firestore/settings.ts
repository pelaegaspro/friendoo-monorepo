import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { AppSettings, AdminUser } from '@/types'

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'app'))
    return snap.exists() ? (snap.data() as AppSettings) : null
  } catch (e) {
    console.error('getSettings error:', e)
    return null
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
  await setDoc(doc(db, 'settings', 'app'), data, { merge: true })
}

export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'))
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AdminUser))
  } catch (e) {
    console.error('getAdmins error:', e)
    return []
  }
}

export async function addAdmin(uid: string, data: Omit<AdminUser, 'uid'>): Promise<void> {
  await setDoc(doc(db, 'admins', uid), data)
}

export async function removeAdmin(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', uid))
}

export async function updateAdminDoc(uid: string, data: Partial<AdminUser>): Promise<void> {
  await updateDoc(doc(db, 'admins', uid), data as Record<string, unknown>)
}
