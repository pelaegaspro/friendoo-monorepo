import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/guard'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { getCachedOrFetch } from '@/lib/admin/cache'
import { getAppAvatarUrl } from '@/lib/avatar'

export const dynamic = 'force-dynamic'

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
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const data = await getCachedOrFetch('admin:dashboard:charts', async () => {
    try {
      const supabase = getSupabaseAdmin()
      const days = getLast14Days()
      const startDate = days[0].ts.toISOString()

      const [usersRes, callsRes, txRes, latestCallsRes, paymentOrdersRes, packagesRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, phone, created_at').gte('created_at', startDate).order('created_at', { ascending: false }),
        supabase.from('calls').select('id, caller_id, host_id, status, rate_per_minute, total_coins_deducted, started_at, ended_at, created_at').gte('created_at', startDate).order('created_at', { ascending: false }),
        supabase.from('payment_orders').select('amount_inr, created_at').eq('status', 'success').gte('created_at', startDate),
        supabase.from('calls').select('id, caller_id, host_id, status, rate_per_minute, total_coins_deducted, started_at, ended_at, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('payment_orders').select('id, user_id, package_id, status, amount_inr, coins, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('coin_packages').select('id, coins, amount_inr, is_active').order('coins', { ascending: true }).limit(6),
      ])

      // Gather profile IDs to resolve user & host names
      const neededProfileIds = new Set<string>()
      ;(latestCallsRes.data ?? []).forEach((c) => {
        if (c.caller_id) neededProfileIds.add(c.caller_id)
        if (c.host_id) neededProfileIds.add(c.host_id)
      })
      ;(paymentOrdersRes.data ?? []).forEach((o) => {
        if (o.user_id) neededProfileIds.add(o.user_id)
      })

      const profilesMap = new Map<string, { display_name?: string; phone?: string; avatar_path?: string }>()
      if (neededProfileIds.size > 0) {
        try {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, display_name, phone, avatar_path')
            .in('id', Array.from(neededProfileIds))
          ;(profs ?? []).forEach((p) => profilesMap.set(p.id, p))
        } catch (err) {
          console.warn('Dashboard charts profiles fetch warning:', err)
        }
      }

      const userMap = new Map<string, number>()
      const callMap = new Map<string, number>()
      const revenueMap = new Map<string, number>()

      ;(usersRes.data ?? []).forEach((u) => {
        if (!u.created_at) return
        const label = dateLabel(new Date(u.created_at))
        userMap.set(label, (userMap.get(label) ?? 0) + 1)
      })

      ;(callsRes.data ?? []).forEach((c) => {
        if (!c.created_at) return
        const label = dateLabel(new Date(c.created_at))
        callMap.set(label, (callMap.get(label) ?? 0) + 1)
      })

      ;(txRes.data ?? []).forEach((tx) => {
        if (!tx.created_at) return
        const label = dateLabel(new Date(tx.created_at))
        revenueMap.set(label, (revenueMap.get(label) ?? 0) + (tx.amount_inr ?? 0))
      })

      const revenueData = days.map(({ date }) => ({ date, revenue: revenueMap.get(date) ?? 0 }))
      const userData = days.map(({ date }) => ({ date, users: userMap.get(date) ?? 0 }))
      const callData = days.map(({ date }) => ({ date, calls: callMap.get(date) ?? 0 }))

      const recentUsers = (usersRes.data ?? []).slice(0, 5).map((u) => ({
        id: u.id,
        name: u.display_name || 'Friendoo User',
        phone: u.phone || '',
        joinedAt: u.created_at || null,
      }))

      const callList = (latestCallsRes.data && latestCallsRes.data.length > 0)
        ? latestCallsRes.data
        : (callsRes.data ?? []).slice(0, 10)

      const recentCalls = callList.map((c) => {
        let durationSeconds = 0
        if (c.started_at && c.ended_at) {
          durationSeconds = Math.max(0, Math.round((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000))
        } else if (c.started_at && (c.status === 'active' || c.status === 'accepted')) {
          durationSeconds = Math.max(0, Math.round((Date.now() - new Date(c.started_at).getTime()) / 1000))
        }
        const callerProf = profilesMap.get(c.caller_id)
        const hostProf = profilesMap.get(c.host_id)
        return {
          id: c.id,
          callerName: callerProf?.display_name || (callerProf?.phone ? `User (${callerProf.phone.slice(-4)})` : 'User'),
          hostName: hostProf?.display_name || 'Host',
          coinsSpent: c.total_coins_deducted || 0,
          coinsDeducted: c.total_coins_deducted || 0,
          durationSeconds,
          status: c.status || 'ended',
          createdAt: c.created_at || null,
        }
      })

      // Live recent orders from Supabase payment_orders
      const liveOrders = (paymentOrdersRes.data ?? []).map((o) => {
        const prof = profilesMap.get(o.user_id)
        const customer = prof?.display_name || (prof?.phone ? `User (${prof.phone.slice(-4)})` : `Customer #${o.id.slice(0, 6)}`)
        const avatar = getAppAvatarUrl(prof?.avatar_path) || ''
        const status = o.status === 'success' ? 'Completed' : (o.status === 'pending' ? 'Processing' : 'Failed')
        const statusColor = o.status === 'success'
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
          : (o.status === 'pending'
             ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
             : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400')
        return {
          id: o.id,
          customer,
          avatar,
          product: `${o.coins ?? 0} Coins Recharge`,
          date: dateLabel(new Date(o.created_at)),
          amount: `₹${(o.amount_inr ?? 0).toLocaleString('en-IN')}`,
          status,
          statusColor,
        }
      })

      const recentOrders = liveOrders

      // Live top products / coin packages from Supabase coin_packages
      const packageIcons = ['🪙', '⚡', '💎', '👑', '🌟']
      const topProducts = (packagesRes.data && packagesRes.data.length > 0)
        ? packagesRes.data.map((pkg, idx) => ({
            id: pkg.id,
            name: `${pkg.coins} Coins Recharge`,
            subtitle: pkg.is_active ? 'Active Package' : 'Archived',
            price: `₹${(pkg.amount_inr ?? 0).toLocaleString('en-IN')}`,
            icon: packageIcons[idx % packageIcons.length],
          }))
        : []

      const totalCalls = (callsRes.data ?? []).length
      const completedCalls = (callsRes.data ?? []).filter((c) => c.status === 'ended').length
      const activeCalls = (callsRes.data ?? []).filter(
        (c) => (c.status === 'active' || c.status === 'accepted' || c.status === 'ringing') && !c.ended_at && (Date.now() - new Date(c.created_at).getTime() <= 30 * 60 * 1000)
      ).length
      const missedCalls = (callsRes.data ?? []).filter((c) => c.status === 'missed' || c.status === 'rejected').length
      const orderCount = (paymentOrdersRes.data ?? []).length

      const totalActivity = totalCalls + orderCount
      const otherActivity = Math.max(0, totalActivity - completedCalls - activeCalls - missedCalls - orderCount)
      const percent = (value: number) => totalActivity > 0
        ? Math.round((value / totalActivity) * 100)
        : 0

      const activitySegments = [
        { name: 'Completed Calls', value: completedCalls, color: '#A78BFA' },
        { name: 'Coin Orders', value: orderCount, color: '#22D3EE' },
        { name: 'Active Calls', value: activeCalls, color: '#34D399' },
        { name: 'Missed / Rejected', value: missedCalls, color: '#FB7185' },
        { name: 'Other Calls', value: otherActivity, color: '#FBBF24' },
      ]
      const donutSegments = activitySegments
        .filter((segment) => segment.value > 0)
        .map((segment) => ({ ...segment, percentage: percent(segment.value) }))
      const donutTotal = totalActivity

      return {
        revenueData,
        userData,
        callData,
        recentUsers,
        recentCalls,
        recentOrders,
        topProducts,
        donutSegments,
        donutTotal,
      }
    } catch (error) {
      console.warn('dashboard charts error:', error)
      const days = getLast14Days()
      return {
        revenueData: days.map(({ date }) => ({ date, revenue: 0 })),
        userData: days.map(({ date }) => ({ date, users: 0 })),
        callData: days.map(({ date }) => ({ date, calls: 0 })),
        recentUsers: [],
        recentCalls: [],
        recentOrders: [],
        topProducts: [],
        donutSegments: [],
        donutTotal: 0,
      }
    }
  }, 15)

  return NextResponse.json(data)
}
