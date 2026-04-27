'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import StatCard from '@/components/admin/StatCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import { adminFetch } from '@/lib/admin/client'
import type { AdminStats } from '@/lib/admin/types'
import { formatInr } from '@/lib/admin/format'

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalHosts: 0,
  activeCalls: 0,
  todaysRevenueInr: 0,
  totalCoinsInCirculation: 0,
  pendingHostApplications: 0,
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const nextStats = await adminFetch<AdminStats>('/api/admin/stats')
      setStats(nextStats)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString('en-IN')} />
            <StatCard label="Total Hosts" value={stats.totalHosts.toLocaleString('en-IN')} />
            <StatCard label="Active Calls" value={stats.activeCalls.toLocaleString('en-IN')} />
            <StatCard label="Today's Revenue" value={formatInr(stats.todaysRevenueInr)} />
            <StatCard
              label="Coins in Circulation"
              value={stats.totalCoinsInCirculation.toLocaleString('en-IN')}
            />
            <StatCard
              label="Pending Applications"
              value={stats.pendingHostApplications.toLocaleString('en-IN')}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard
              title="Operational Snapshot"
              description="A quick view of the live Friendoo economy and host pipeline."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#2d2d2d] bg-[#161616] p-4">
                  <p className="text-sm text-zinc-400">Host pipeline</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {stats.pendingHostApplications} pending reviews
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Approving a host makes them available in the main app immediately.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#2d2d2d] bg-[#161616] p-4">
                  <p className="text-sm text-zinc-400">User liquidity</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {stats.totalCoinsInCirculation.toLocaleString('en-IN')} coins
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Useful when tuning top-up pricing and call thresholds in settings.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Admin Notes" description="Server-side controls and reminders.">
              {stats.totalUsers === 0 ? (
                <DataState
                  title="No production data yet"
                  body="Once users and transactions are present, the dashboard will populate automatically."
                />
              ) : (
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
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
