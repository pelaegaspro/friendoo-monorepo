import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb } from '@/lib/firebaseAdmin'

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const db = getDb()
    // Fetch pending payouts from the payoutHistory subcollections
    const snap = await db.collectionGroup('payoutHistory')
      .where('status', '==', 'pending')
      .orderBy('requestedAt', 'desc')
      .limit(100)
      .get()

    const pendingPayouts = snap.docs.map((doc) => {
      const d = doc.data()
      const requestedAt = d.requestedAt?.toDate?.()?.toISOString() ?? null
      return { id: doc.id, ...d, requestedAt }
    })

    return NextResponse.json({ pendingPayouts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
