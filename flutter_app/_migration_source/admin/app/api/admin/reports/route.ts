import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb } from '@/lib/firebaseAdmin'

function asString(v: unknown, fallback = '') {
  return typeof v === 'string' ? v : fallback
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const db = getDb()
    const [reportsSnap, usersSnap] = await Promise.all([
      db.collection('reports').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('users').get(),
    ])

    // Map of UIDs to Aliases for anonymous moderation
    const userAliases = new Map(
      usersSnap.docs.map((doc) => [doc.id, asString(doc.data().alias, 'Anonymous User')])
    )

    const reports = reportsSnap.docs.map((doc) => {
      const d = doc.data()
      const reporterId = asString(d.reporterId || d.fromUserId)
      const reportedId = asString(d.reportedId || d.toUserId)
      return {
        id: doc.id,
        reporterId,
        reporterName: userAliases.get(reporterId) ?? 'Unknown Alias',
        reportedId,
        reportedName: userAliases.get(reportedId) ?? 'Unknown Alias',
        reason: asString(d.reason),
        status: (['pending', 'actioned', 'dismissed'].includes(asString(d.status)) ? asString(d.status) : 'pending') as 'pending' | 'actioned' | 'dismissed',
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
