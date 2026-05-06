import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getDb } from '@/lib/firebaseAdmin'

function dateLabel(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function getLast14Days() {
  const days: { date: string; ts: Date }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push({ date: dateLabel(d), ts: new Date(d) })
  }
  return days
}

export async function GET() {
  const unauthorized = requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const db = getDb()
    const days = getLast14Days()
    const startDate = days[0].ts

    const [usersSnap, callsSnap, txSnap] = await Promise.all([
      db.collection('users').where('createdAt', '>=', startDate).get(),
      db.collection('calls').where('createdAt', '>=', startDate).get(),
      db.collection('coinTransactions').where('type', '==', 'topup').where('createdAt', '>=', startDate).get(),
    ])

    // Build lookup maps: dateLabel -> count/revenue
    const userMap = new Map<string, number>()
    const callMap = new Map<string, number>()
    const revenueMap = new Map<string, number>()

    usersSnap.forEach((doc) => {
      const ts = doc.data().createdAt?.toDate?.()
      if (!ts) return
      const label = dateLabel(ts)
      userMap.set(label, (userMap.get(label) ?? 0) + 1)
    })

    callsSnap.forEach((doc) => {
      const ts = doc.data().createdAt?.toDate?.()
      if (!ts) return
      const label = dateLabel(ts)
      callMap.set(label, (callMap.get(label) ?? 0) + 1)
    })

    txSnap.forEach((doc) => {
      const d = doc.data()
      const ts = d.createdAt?.toDate?.()
      if (!ts) return
      const label = dateLabel(ts)
      const amount = typeof d.amountInr === 'number' ? d.amountInr : typeof d.amount === 'number' ? d.amount : 0
      revenueMap.set(label, (revenueMap.get(label) ?? 0) + amount)
    })

    const revenueData = days.map(({ date }) => ({ date, revenue: revenueMap.get(date) ?? 0 }))
    const userData = days.map(({ date }) => ({ date, users: userMap.get(date) ?? 0 }))
    const callData = days.map(({ date }) => ({ date, calls: callMap.get(date) ?? 0 }))

    // Recent activity — last 5 each
    const recentUsers = usersSnap.docs
      .sort((a, b) => {
        const at = a.data().createdAt?.toDate?.()?.getTime() ?? 0
        const bt = b.data().createdAt?.toDate?.()?.getTime() ?? 0
        return bt - at
      })
      .slice(0, 5)
      .map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          name: typeof d.displayName === 'string' ? d.displayName : 'Friendoo User',
          phone: typeof d.phoneNumber === 'string' ? d.phoneNumber : '',
          joinedAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        }
      })

    const recentCalls = callsSnap.docs
      .sort((a, b) => {
        const at = a.data().createdAt?.toDate?.()?.getTime() ?? 0
        const bt = b.data().createdAt?.toDate?.()?.getTime() ?? 0
        return bt - at
      })
      .slice(0, 5)
      .map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          coinsSpent: typeof d.coinsSpent === 'number' ? d.coinsSpent : 0,
          durationSeconds: typeof d.finalDurationSeconds === 'number' ? d.finalDurationSeconds : typeof d.durationSeconds === 'number' ? d.durationSeconds : 0,
          status: typeof d.status === 'string' ? d.status : 'ended',
          createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        }
      })

    return NextResponse.json({ revenueData, userData, callData, recentUsers, recentCalls })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
