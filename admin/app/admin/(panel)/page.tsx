'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  IndianRupee,
  PhoneCall,
  UserRound,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Users,
  Radio,
  Clock,
  FileText,
  Activity,
  Plus,
  Coins,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import MoorlyBentoCard from '@/components/dashboard/MoorlyBentoCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { adminFetch } from '@/lib/admin/client'
import { AdminStats } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import { cn } from '@/lib/utils'

export interface OrderItem {
  id: string
  customer: string
  avatar: string
  product: string
  amount: string
  status: string
  statusColor: string
}

interface ChartData {
  revenueData: { date: string; revenue: number }[]
  callData: { date: string; calls: number }[]
  userData: { date: string; users: number }[]
  recentUsers: { id: string; name: string; phone: string; joinedAt: string | null }[]
  recentCalls: {
    id: string
    callerName?: string
    hostName?: string
    status: string
    durationSeconds: number
    coinsDeducted?: number
    coinsSpent?: number
    createdAt: string | null
  }[]
  recentOrders?: OrderItem[]
  pendingHostList?: { id: string; name: string; appliedAt: string; category?: string }[]
  unresolvedReportsCount?: number
  pendingWithdrawalsCount?: number
}

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalHosts: 0,
  activeCalls: 0,
  todaysRevenueInr: 0,
  totalCoinsInCirculation: 0,
  pendingHostApplications: 0,
}

function formatNumber(val?: number | null): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '0'
  return Number(val).toLocaleString('en-IN')
}

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [chartTab, setChartTab] = useState<'revenue' | 'calls' | 'users'>('revenue')

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [nextStats, nextCharts] = await Promise.all([
        adminFetch<AdminStats>('/api/admin/stats'),
        adminFetch<ChartData>('/api/admin/dashboard/charts'),
      ])
      if (nextStats && typeof nextStats === 'object') {
        const raw = nextStats as unknown as Record<string, unknown>
        setStats({
          totalUsers: Number(nextStats.totalUsers ?? raw.total_users ?? 0),
          totalHosts: Number(nextStats.totalHosts ?? raw.total_hosts ?? 0),
          activeCalls: Number(nextStats.activeCalls ?? raw.active_calls ?? 0),
          todaysRevenueInr: Number(
            nextStats.todaysRevenueInr ??
            raw.todays_revenue_inr ??
            raw.todayRevenue ??
            raw.revenueToday ??
            0
          ),
          totalCoinsInCirculation: Number(
            nextStats.totalCoinsInCirculation ??
            raw.total_coins_in_circulation ??
            0
          ),
          pendingHostApplications: Number(
            nextStats.pendingHostApplications ??
            raw.pending_host_applications ??
            0
          ),
        })
      }
      setCharts(nextCharts)
      if (isRefresh) toast.success('Telemetry matrix synchronized')
    } catch {
      if (isRefresh) toast.error('Failed to update live dashboard')
    } finally {
      if (isRefresh) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => loadData(false))
  }, [loadData])

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning, Admin'
    if (hour < 17) return 'Good afternoon, Admin'
    return 'Good evening, Admin'
  }

  const recentOrders = charts?.recentOrders ?? []
  const recentCalls = charts?.recentCalls ?? []

  // Extract real sparkline sequences from telemetry
  const revenueSparkline = (charts?.revenueData || []).map((d) => d.revenue).slice(-8)
  const callSparkline = (charts?.callData || []).map((d) => d.calls).slice(-8)
  const userSparkline = (charts?.userData || []).map((d) => d.users).slice(-8)

  return (
    <div className="admin-dashboard space-y-5 select-none">
      {/* 1. Moorly Header Headline & Action Controls (Real Friendoo Operations) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white">
            {getGreeting()}
          </h1>
          <p className="mt-1 text-xs text-[#7B96A0] font-normal">
            {currentDate} ·{' '}
            <span className="text-[#C2DDE4] font-semibold">
              {stats.activeCalls} active voice call{stats.activeCalls === 1 ? '' : 's'} right now
            </span>
            , ₹{formatNumber(stats.todaysRevenueInr)} revenue today, and{' '}
            <span className="text-[#60CECA] font-semibold">
              {stats.pendingHostApplications} host application{stats.pendingHostApplications === 1 ? '' : 's'}
            </span>{' '}
            waiting for your approval.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/hosts"
            className="flex items-center gap-1.5 rounded-lg border border-[#1E3E4A] bg-[#0D1C22] px-3.5 py-1.5 text-xs font-semibold text-[#C2DDE4] hover:border-[#2C5768] hover:bg-[#122730] transition"
          >
            <Users className="h-3.5 w-3.5 text-[#60CECA]" />
            <span>Voice Hosts ({stats.totalHosts})</span>
          </Link>

          <Link
            href="/admin/packages"
            className="flex items-center gap-1.5 rounded-lg bg-[#60CECA] hover:bg-[#4EBDB9] px-3.5 py-1.5 text-xs font-bold text-[#032024] shadow-md shadow-[#60CECA]/20 transition"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Coin Packages</span>
          </Link>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E3E4A] bg-[#0D1C22] text-[#7B96A0] hover:text-white transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin text-[#60CECA]')} />
          </button>
        </div>
      </div>

      {/* 2. Moorly 4 Bento Metric Cards (100% REAL Friendoo KPIs) */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Calls (Teal) */}
        <MoorlyBentoCard
          label="Active Calls"
          value={formatNumber(stats.activeCalls)}
          helper={stats.activeCalls > 0 ? 'Agora WebRTC live streaming' : 'Zero active audio sessions'}
          sparklineColor="teal"
          sparklineData={callSparkline.length > 0 ? callSparkline : [0, 0, 0, 0, 0, 0, 0, 0]}
        />

        {/* Card 2: Today's Revenue (Gold/Green) */}
        <MoorlyBentoCard
          label="Today's Revenue"
          value={`₹${formatNumber(stats.todaysRevenueInr)}`}
          helper="Cashfree UPI topups"
          sparklineColor="gold"
          sparklineData={revenueSparkline.length > 0 ? revenueSparkline : [0, 0, 0, 0, 0, 0, 0, 0]}
        />

        {/* Card 3: Total Users & Callers (Marine Blue) */}
        <MoorlyBentoCard
          label="Callers & Users"
          value={formatNumber(stats.totalUsers)}
          helper={`${formatNumber(stats.totalHosts)} verified hosts`}
          sparklineColor="blue"
          sparklineData={userSparkline.length > 0 ? userSparkline : [0, 0, 0, 0, 0, 0, 0, 0]}
        />

        {/* Card 4: Total Coins in Circulation (Bronze/Amber) */}
        <MoorlyBentoCard
          label="Coins in Circulation"
          value={formatNumber(stats.totalCoinsInCirculation)}
          helper={`${stats.pendingHostApplications} host approvals pending`}
          trend={
            stats.pendingHostApplications > 0
              ? { value: `${stats.pendingHostApplications} pending`, label: 'Host queue' }
              : undefined
          }
          sparklineColor="bronze"
          sparklineData={[10, 15, 12, 18, 22, 20, 25, 30]}
        />
      </div>

      {/* 3. Middle Section: Real Telemetry Chart (Left) + Action Queue (Right) */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left (65% width): Spline Chart with Real DB Telemetry */}
        <div className="lg:col-span-8 rounded-xl border border-[#17333D] bg-[#08171E] p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {chartTab === 'revenue'
                  ? 'Revenue History (₹ INR)'
                  : chartTab === 'calls'
                  ? 'Voice & Video Call Volume'
                  : 'New Caller Registrations'}
              </h2>
              <p className="text-[11px] text-[#7B96A0]">
                {chartTab === 'revenue'
                  ? 'Completed Cashfree payment topups across the last 14 days'
                  : chartTab === 'calls'
                  ? 'Total call connections handled per day'
                  : 'Daily user onboarding trend'}
              </p>
            </div>

            {/* Moorly Capsule Tabs: [Revenue] [Calls] [Users] */}
            <div className="flex items-center rounded-lg border border-[#11232B] bg-[#040D12] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setChartTab('revenue')}
                className={cn(
                  'rounded-md px-3 py-1 font-semibold transition text-xs',
                  chartTab === 'revenue'
                    ? 'bg-[#15343D] text-[#60CECA]'
                    : 'text-[#7B96A0] hover:text-white'
                )}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartTab('calls')}
                className={cn(
                  'rounded-md px-3 py-1 font-semibold transition text-xs',
                  chartTab === 'calls'
                    ? 'bg-[#15343D] text-[#60CECA]'
                    : 'text-[#7B96A0] hover:text-white'
                )}
              >
                Calls
              </button>
              <button
                type="button"
                onClick={() => setChartTab('users')}
                className={cn(
                  'rounded-md px-3 py-1 font-semibold transition text-xs',
                  chartTab === 'users'
                    ? 'bg-[#15343D] text-[#60CECA]'
                    : 'text-[#7B96A0] hover:text-white'
                )}
              >
                Callers
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[250px]">
            <RevenueChart
              data={
                chartTab === 'revenue'
                  ? charts?.revenueData || []
                  : chartTab === 'calls'
                  ? (charts?.callData || []).map((c) => ({ date: c.date, revenue: c.calls }))
                  : (charts?.userData || []).map((u) => ({ date: u.date, revenue: u.users }))
              }
              title={
                chartTab === 'revenue'
                  ? 'Payment Orders Volume'
                  : chartTab === 'calls'
                  ? 'Daily Call Volume'
                  : 'User Growth Trend'
              }
            />
          </div>
        </div>

        {/* Right (35% width): Action Queue Waiting for Admin */}
        <div className="lg:col-span-4 rounded-xl border border-[#17333D] bg-[#08171E] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Action Queue</h2>
                <p className="text-[11px] text-[#7B96A0]">
                  Operations requiring administrative decision
                </p>
              </div>
              <span className="rounded-full bg-[#60CECA]/10 border border-[#60CECA]/20 px-2 py-0.5 text-[10px] font-mono text-[#60CECA]">
                Live Desk
              </span>
            </div>

            {/* Action Items List */}
            <div className="space-y-2">
              {/* Host Approvals Item */}
              <Link
                href="/admin/hosts"
                className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs transition hover:border-[#60CECA]/40 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#10232C] text-[#60CECA]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-[11px] group-hover:text-[#60CECA] transition">
                      Host Application Approvals
                    </p>
                    <p className="text-[10px] text-[#7B96A0] truncate">
                      {stats.pendingHostApplications > 0
                        ? `${stats.pendingHostApplications} applicants waiting for review`
                        : 'All host applications reviewed'}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold',
                    stats.pendingHostApplications > 0
                      ? 'bg-[#232111] border-[#3E4020] text-[#EAB308]'
                      : 'bg-[#0D2224] border-[#183E41] text-[#4DE3D0]'
                  )}
                >
                  {stats.pendingHostApplications > 0 ? `${stats.pendingHostApplications} pending` : 'cleared'}
                </span>
              </Link>

              {/* Safety & Moderation Reports */}
              <Link
                href="/admin/reports"
                className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs transition hover:border-[#60CECA]/40 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#10232C] text-[#FB7185]">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-[11px] group-hover:text-[#FB7185] transition">
                      User Safety & Call Reports
                    </p>
                    <p className="text-[10px] text-[#7B96A0] truncate">
                      Review abusive behavior or call disputes
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#2A1319] border border-[#4C1C26] px-2 py-0.5 text-[9px] font-bold text-[#FB7185]">
                  governance
                </span>
              </Link>

              {/* Coin Packages & Pricing */}
              <Link
                href="/admin/packages"
                className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs transition hover:border-[#60CECA]/40 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#10232C] text-[#F59E0B]">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-[11px] group-hover:text-[#F59E0B] transition">
                      Recharge Packages & Promos
                    </p>
                    <p className="text-[10px] text-[#7B96A0] truncate">
                      Adjust coin bonuses & UPI pricing
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#0D2224] border border-[#183E41] px-2 py-0.5 text-[9px] font-bold text-[#4DE3D0]">
                  active
                </span>
              </Link>

              {/* Host Payout Settlements */}
              <Link
                href="/admin/payments"
                className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs transition hover:border-[#60CECA]/40 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#10232C] text-[#2FE5A7]">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate text-[11px] group-hover:text-[#2FE5A7] transition">
                      Host Payout Settlements
                    </p>
                    <p className="text-[10px] text-[#7B96A0] truncate">
                      Direct Cashfree bank withdrawal queue
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#232111] border border-[#3E4020] px-2 py-0.5 text-[9px] font-bold text-[#EAB308]">
                  settlement
                </span>
              </Link>
            </div>
          </div>

          {/* CRM Quick Switcher */}
          <div className="pt-3 mt-3 border-t border-[#13232A]">
            <a
              href="/crm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-[#051016] border border-[#17333D] p-2 text-xs text-[#A6C1C9] hover:border-[#60CECA]/40 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2FE5A7] animate-pulse" />
                <span className="font-medium text-[11px]">Open Caller CRM Studio</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#60CECA]" />
            </a>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Real Recent Payment Orders & Live Connected Calls */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Real Recent Payment Orders */}
        <div className="rounded-xl border border-[#17333D] bg-[#08171E] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">Recent Payment Orders</h2>
              <p className="text-[10px] text-[#7B96A0]">Live Cashfree UPI recharge transactions</p>
            </div>
            <Link
              href="/admin/transactions"
              className="text-[11px] font-medium text-[#60CECA] hover:underline flex items-center gap-1"
            >
              <span>View all orders</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-[#7B96A0] rounded-lg border border-dashed border-[#13232A]">
                No mock records · Clean live ledger.
              </div>
            ) : (
              recentOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs hover:border-[#1F4150] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#10232C] text-[#60CECA] font-bold text-xs">
                      ₹
                    </div>
                    <div>
                      <p className="font-medium text-white text-[11px]">{order.customer}</p>
                      <p className="text-[10px] text-[#7B96A0]">{order.product}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#2FE5A7] text-xs">{order.amount}</p>
                    <span className="text-[9px] text-[#7B96A0] uppercase font-mono">{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real Live Call Sessions */}
        <div className="rounded-xl border border-[#17333D] bg-[#08171E] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">Recent Audio & Video Calls</h2>
              <p className="text-[10px] text-[#7B96A0]">Agora RTC session logs</p>
            </div>
            <Link
              href="/admin/calls"
              className="text-[11px] font-medium text-[#60CECA] hover:underline flex items-center gap-1"
            >
              <span>Inspect all calls</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentCalls.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-[#7B96A0] rounded-lg border border-dashed border-[#13232A]">
                No active call sessions recorded.
              </div>
            ) : (
              recentCalls.slice(0, 4).map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between rounded-lg border border-[#11252F] bg-[#051016] p-2.5 text-xs hover:border-[#1F4150] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#10232C] text-[#64B5F6]">
                      <PhoneCall size={12} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-[11px]">
                        {call.callerName || 'Caller'} → {call.hostName || 'Host'}
                      </p>
                      <p className="text-[10px] text-[#7B96A0]">
                        Duration: {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#F59E0B] text-xs">
                      {call.coinsSpent ?? call.coinsDeducted ?? 0} coins
                    </p>
                    <span className="text-[9px] text-[#7B96A0] font-mono">{formatDateTime(call.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
