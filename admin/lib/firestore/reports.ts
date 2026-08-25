import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Report } from '@/types'

export async function getReports(): Promise<Report[]> {
  try {
    const snap = await getDocs(collection(db, 'reports'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))
  } catch (e) {
    console.error('getReports error:', e)
    return []
  }
}

export async function updateReport(id: string, data: Partial<Report>): Promise<void> {
  await updateDoc(doc(db, 'reports', id), data as Record<string, unknown>)
}
