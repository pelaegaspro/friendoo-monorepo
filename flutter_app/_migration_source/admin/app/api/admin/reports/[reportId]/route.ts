import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb, adminFieldValue } from '@/lib/firebaseAdmin'

export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { action, reportedId } = await req.json() as { action: 'ban' | 'dismiss'; reportedId: string }
    const db = getDb()
    const now = adminFieldValue.serverTimestamp()

    if (action === 'ban' && reportedId) {
      // Ban the reported user
      await db.collection('users').doc(reportedId).set(
        { isBanned: true, bannedAt: now, bannedBy: 'admin', updatedAt: now },
        { merge: true }
      )
      // Mark report as actioned
      await db.collection('reports').doc(params.reportId).set(
        { status: 'actioned', reviewedAt: now, reviewedBy: 'admin' },
        { merge: true }
      )
    } else {
      // Dismiss
      await db.collection('reports').doc(params.reportId).set(
        { status: 'dismissed', reviewedAt: now, reviewedBy: 'admin' },
        { merge: true }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
