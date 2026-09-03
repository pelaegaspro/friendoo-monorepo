'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import StatCard from '@/components/admin/StatCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import { adminFetch } from '@/lib/admin/client'
import type { AdminStats } from '@/lib/admin/types'
import { formatInr, formatDateTime } from '@/lib/admin/format'
import dynamic from 'next/dynamic'
import { RefreshCw } from 'lucide-react'

// Lazy-load chart components (recharts uses browser APIs)
const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart'), { ssr: false })
const UserGrowthChart = dynamic(() => import('@/components/dashboard/UserGrowthChart'), { ssr: false })
const CallVolumeChart = dynamic(() => import('@/components/dashboard/CallVolumeChart'), { ssr: false })

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalHosts: 0,
  activeCalls: 0,
  todaysRevenueInr: 0,
  totalCoinsInCirculation: 0,
  pendingHostApplications: 0,
}

type ChartData = {
  revenueData: { date: string; revenue: number }[]
  userData: { date: string; users: number }[]
  callData: { date: string; calls: number }[]
  recentUsers: { id: string; name: string; phone: string; joinedAt: string | null }[]
  recentCalls: { id: string; coinsSpent: number; durationSeconds: number; status: string; createdAt: string | null }[]
}

const emptyCharts: ChartData = {
  revenueData: [],
  userData: [],
  callData: [],
  recentUsers: [],
  recentCalls: [],
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [charts, setCharts] = useState<ChartData>(emptyCharts)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [nextStats, nextCharts] = await Promise.all([
        adminFetch<AdminStats>('/api/admin/stats'),
        adminFetch<ChartData>('/api/admin/dashboard/charts'),
      ])
      setStats(nextStats)
      setCharts(nextCharts)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(() => load()) }, [load])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500">Live overview of the Friendoo platform.</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <LoadingBlock rows={8} />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString('en-IN')} />
            <StatCard label="Total Hosts" value={stats.totalHosts.toLocaleString('en-IN')} />
            <StatCard label="Active Calls" value={stats.activeCalls.toLocaleString('en-IN')} />
            <StatCard label="Today's Revenue" value={formatInr(stats.todaysRevenueInr)} />
            <StatCard label="Coins in Circulation" value={stats.totalCoinsInCirculation.toLocaleString('en-IN')} />
            <StatCard label="Pending Applications" value={stats.pendingHostApplications.toLocaleString('en-IN')} />
          </div>

          {/* Charts Row 1 — Revenue + Calls */}
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard>
              {charts.revenueData.length > 0
                ? <RevenueChart data={charts.revenueData} />
                : <DataState title="No revenue data yet" body="Revenue chart will appear once transactions occur." />}
            </SectionCard>
            <SectionCard>
              {charts.callData.length > 0
                ? <CallVolumeChart data={charts.callData} />
                : <DataState title="No call data yet" body="Call volume chart will appear once calls happen." />}
            </SectionCard>
          </div>

          {/* Charts Row 2 — User Growth */}
          <SectionCard>
            {charts.userData.length > 0
              ? <UserGrowthChart data={charts.userData} />
              : <DataState title="No user growth data yet" body="User growth chart will appear once users register." />}
          </SectionCard>

          {/* Recent Activity */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Recent Signups */}
            <SectionCard title="Recent Signups" description="Latest 5 new users on the platform">
              {charts.recentUsers.length === 0 ? (
                <DataState title="No recent signups" body="New user signups will appear here." />
              ) : (
                <div className="space-y-3">
                  {charts.recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#161616] px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-zinc-500">{u.phone || '—'}</p>
                      </div>
                      <p className="text-xs text-zinc-600">{u.joinedAt ? formatDateTime(u.joinedAt) : '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Recent Calls */}
            <SectionCard title="Recent Calls" description="Latest 5 calls on the platform">
              {charts.recentCalls.length === 0 ? (
                <DataState title="No recent calls" body="Recent calls will appear here." />
              ) : (
                <div className="space-y-3">
                  {charts.recentCalls.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#161616] px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{formatDuration(c.durationSeconds)}</p>
                        <p className="text-xs text-zinc-500">{c.coinsSpent} coins spent</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.status === 'ended' ? 'bg-green-500/15 text-green-300' :
                          c.status === 'active' ? 'bg-blue-500/15 text-blue-300' :
                          'bg-red-500/15 text-red-300'
                        }`}>
                          {c.status}
                        </span>
                        <p className="mt-1 text-xs text-zinc-600">{c.createdAt ? formatDateTime(c.createdAt) : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Admin Notes */}
          <SectionCard title="Admin Notes" description="Server-side controls and reminders.">
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#161616] p-4">
                Refresh this dashboard after major host or package updates to validate the live counters.
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#161616] p-4">
                Use the Settings page to change onboarding bonus, call threshold, and maintenance mode.
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#161616] p-4">
                Transactions and calls pages include exports and detail views for support follow-up.
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
