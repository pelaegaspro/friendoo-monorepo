import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb, adminFieldValue } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json() as { hostId: string; utr: string; amountInr: number }
    const { hostId, utr, amountInr } = body

    if (!hostId || !utr || typeof amountInr !== 'number') {
      return NextResponse.json({ error: 'hostId, utr and amountInr are required' }, { status: 400 })
    }

    const db = getDb()

    // 1. Record payout in a dedicated collection
    await db.collection('hostPayouts').add({
      hostId,
      utr: utr.trim(),
      amountInr,
      paidAt: adminFieldValue.serverTimestamp(),
      paidBy: 'admin',
      status: 'paid',
    })

    // 2. Optionally reset coinsEarned in host doc (mark as paid out)
    await db.collection('users').doc(hostId).set(
      {
        lastPayoutAt: adminFieldValue.serverTimestamp(),
        lastPayoutAmountInr: amountInr,
        lastPayoutUtr: utr.trim(),
        updatedBy: 'admin',
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const db = getDb()
    const snap = await db.collection('hostPayouts').orderBy('paidAt', 'desc').limit(100).get()
    const payouts = snap.docs.map((doc) => {
      const d = doc.data()
      const paidAt = d.paidAt?.toDate?.()?.toISOString() ?? null
      return { id: doc.id, ...d, paidAt }
    })
    return NextResponse.json({ payouts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
