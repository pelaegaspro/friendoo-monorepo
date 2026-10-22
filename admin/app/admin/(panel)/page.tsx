'use client'

import React, { useState, useEffect, useCallback, useMemo, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  IndianRupee,
  PhoneCall,
  UserRound,
  Package,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  Search,
  Download,
  Copy,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Layers,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatCard from '@/components/admin/StatCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import OrderStatusDonut, { DonutSegment } from '@/components/dashboard/OrderStatusDonut'
import SideSheet from '@/components/admin/SideSheet'
import { adminFetch } from '@/lib/admin/client'
import { AdminStats, AdminUserRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'

export interface OrderItem {
  id: string
  customer: string
  avatar: string
  product: string
  amount: string
  status: string
  statusColor: string
}

export interface TopProductItem {
  id: string
  name: string
  subtitle: string
  price: string
  icon: string
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
  topProducts?: TopProductItem[]
  donutSegments?: DonutSegment[]
  donutTotal?: number
}

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalHosts: 0,
  activeCalls: 0,
  todaysRevenueInr: 0,
  totalCoinsInCirculation: 0,
  pendingHostApplications: 0,
}

export default function UnifiedAdminCrmPage() {
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'crm'>('all')

  // CRM Search & Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'zero' | 'banned'>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [coinsModalUser, setCoinsModalUser] = useState<AdminUserRow | null>(null)
  const [coinsAmount, setCoinsAmount] = useState(100)
  const [savingCoins, setSavingCoins] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [nextStats, nextCharts, usersRes] = await Promise.all([
        adminFetch<AdminStats>('/api/admin/stats'),
        adminFetch<ChartData>('/api/admin/dashboard/charts'),
        adminFetch<{ users: AdminUserRow[] }>('/api/admin/users/list'),
      ])
      if (nextStats) setStats(nextStats)
      if (nextCharts) setCharts(nextCharts)
      if (usersRes?.users) setUsers(usersRes.users)
    } catch {
      // Graceful fallback to cached state
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => loadData())
  }, [loadData])

  // Get dynamic greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Filtered CRM users
  const filteredUsers = useMemo(() => {
    let result = users
    const query = search.trim().toLowerCase()

    if (query) {
      result = result.filter((user) =>
        [user.displayName, user.username, user.phoneNumber, user.city].some((value) =>
          (value || '').toLowerCase().includes(query)
        )
      )
    }

    if (filterType === 'positive') {
      result = result.filter((u) => u.coinBalance > 0)
    } else if (filterType === 'zero') {
      result = result.filter((u) => u.coinBalance === 0)
    } else if (filterType === 'banned') {
      result = result.filter((u) => u.status === 'banned')
    }

    return result
  }, [search, filterType, users])

  // Add Coins
  const handleAddCoins = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!coinsModalUser) return
    setSavingCoins(true)
    try {
      await adminFetch('/api/admin/users/addCoins', {
        method: 'POST',
        body: JSON.stringify({
          userId: coinsModalUser.id,
          amountCoins: coinsAmount,
          idempotencyKey: `admin_adjust:${coinsModalUser.id}:${crypto.randomUUID()}`,
        }),
      })
      toast.success(`Credited ${coinsAmount} coins to ${coinsModalUser.displayName}`)
      setCoinsModalUser(null)
      setCoinsAmount(100)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add coins')
    } finally {
      setSavingCoins(false)
    }
  }

  // Toggle User Ban
  const handleToggleBan = async (user: AdminUserRow) => {
    try {
      await adminFetch('/api/admin/users/ban', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          isBanned: user.status !== 'banned',
        }),
      })
      toast.success(user.status === 'banned' ? 'User access restored' : 'User account banned')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user status')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === '--') return
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard`)
  }

  const exportCsv = () => {
    const headers = ['Name', 'Username', 'Phone', 'City', 'Coin Balance', 'Status', 'Joined']
    const rows = filteredUsers.map((u) => [
      u.displayName,
      u.username,
      u.phoneNumber,
      u.city,
      String(u.coinBalance),
      u.status,
      u.joinedAt ?? '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `friendoo-customers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const displayOrders = charts?.recentOrders ?? []
  const displayTopProducts = charts?.topProducts ?? []
  const donutSegments: DonutSegment[] = charts?.donutSegments ?? []
  const donutTotal = charts?.donutTotal ?? 0

  return (
    <div className="relative space-y-6">
      {/* Top Greeting Header with Unified Mode Switcher */}
      <div className="relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#171321] via-[#11111a] to-[#10151b] p-5 shadow-[0_24px_80px_-45px_rgba(139,92,246,0.5)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-24 -z-10 h-64 w-64 rounded-full bg-violet-500/20 blur-[90px]" />
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
            Friendoo overview
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            <span>{getGreeting()}</span>
            <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-zinc-400">
            A live view of your community, calls, and payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>All-in-One</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'crm'
                  ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Users size={13} />
              <span>Customer CRM</span>
            </button>
          </div>

          {/* Date Picker Pill */}
          <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2 text-xs font-semibold text-zinc-300 md:flex">
            <Calendar size={14} className="text-violet-300" />
            <span>{currentDate}</span>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-zinc-300 transition hover:bg-white/[0.08]"
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={`₹${stats.todaysRevenueInr.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="purple"
          variant="glass"
          helper="Successful payments"
        />

        <StatCard
          label="Active calls"
          value={stats.activeCalls.toLocaleString('en-IN')}
          icon={PhoneCall}
          color="cyan"
          variant="glass"
          helper="Calls in progress"
        />

        <StatCard
          label="Users"
          value={stats.totalUsers.toLocaleString('en-IN')}
          icon={UserRound}
          color="blue"
          variant="glass"
          helper="Registered accounts"
        />

        <StatCard
          label="Hosts"
          value={stats.totalHosts.toLocaleString('en-IN')}
          icon={Package}
          color="emerald"
          variant="glass"
          helper={`${stats.pendingHostApplications.toLocaleString('en-IN')} applications pending`}
        />
      </div>

      {/* Overview Analytics Row: Shown in 'all' or 'overview' tabs */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <>
          {/* Middle Row: Revenue Overview (65%) + Order Status Donut (35%) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Revenue Overview Card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#12121b]/85 p-5 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl lg:col-span-8">
              <RevenueChart
                data={charts?.revenueData || []}
                title="Revenue Overview"
              />
            </div>

            {/* Order Status Donut Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#12121b]/85 p-5 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl lg:col-span-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">Activity mix</h3>
                <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2 py-0.5 text-[10px] font-bold text-violet-200">
                  Last 14 days
                </span>
              </div>

              <OrderStatusDonut
                total={donutTotal}
                totalLabel="Total Orders"
                segments={donutSegments}
              />
            </div>
          </div>

          {/* Bottom Overview Row: Recent Orders (60%) + Top Products (40%) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Recent payment records */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#12121b]/85 p-5 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Recent payments</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('crm')}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>View customers</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Product / Service</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {displayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-xs text-zinc-500">
                          No payment activity yet.
                        </td>
                      </tr>
                    ) : displayOrders.map((ord) => (
                      <tr key={ord.id} className="group hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition">
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Image
                              src={ord.avatar}
                              alt={ord.customer}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <span className="font-bold text-slate-800 dark:text-white">
                              {ord.customer}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-zinc-300 font-medium">
                          {ord.product}
                        </td>
                        <td className="py-3.5 font-bold text-slate-800 dark:text-white">
                          {ord.amount}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ord.statusColor}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configured coin packages */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#12121b]/85 p-5 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl lg:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Coin packages</h3>
                <Link
                  href="/admin/packages"
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>View All</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="space-y-3.5">
                {displayTopProducts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-zinc-500">
                    No coin packages available.
                  </p>
                ) : displayTopProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg border border-slate-200 dark:border-slate-700">
                        {p.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                          {p.subtitle}
                        </p>
                      </div>
                    </div>

                    <span className="font-bold text-slate-800 dark:text-white text-xs">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer CRM Directory: Shown in 'all' or 'crm' tabs */}
      {(activeTab === 'all' || activeTab === 'crm') && (
        <div id="crm-section" className="space-y-4 pt-2">
          {/* CRM Search, Filter Chips & Export Toolbar */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#12121b]/85 p-5 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">
                    Customer Relationship Management (CRM)
                  </h2>
                  <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2 py-0.5 text-[10px] font-bold text-violet-200">
                    {filteredUsers.length} Clients
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Search clients, inspect call dossiers, grant instant coin bonus presets, and manage platform safety.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filteredUsers.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone (+91...), city..."
                  className="w-full rounded-xl border border-white/[0.08] bg-black/20 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === 'all'
                      ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('positive')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === 'positive'
                      ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Funded (&gt;0)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('zero')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === 'zero'
                      ? 'bg-violet-500/20 text-violet-100 shadow-inner'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Zero Balance
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('banned')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === 'banned'
                      ? 'bg-rose-500/20 text-rose-100 shadow-inner'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Banned ({users.filter((u) => u.status === 'banned').length})
                </button>
              </div>
            </div>
          </div>

          {/* CRM Users Table */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#12121b]/85 shadow-[0_18px_60px_-38px_rgba(139,92,246,0.28)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Customer Profile</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Coin Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-5 text-right">Quick CRM Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        No customers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs shadow-sm">
                                {(u.displayName || 'U')[0].toUpperCase()}
                              </div>
                              {u.isOnline ? (
                                <span
                                  className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                                  title="Online now in app"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                </span>
                              ) : (
                                <span
                                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-900"
                                  title={u.lastSeenAt ? `Last seen in app: ${new Date(u.lastSeenAt).toLocaleTimeString()}` : 'Offline'}
                                />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-800 dark:text-white text-xs">
                                  {u.displayName}
                                </p>
                                {u.isOnline && (
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    App Live
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                ID: {u.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-zinc-300">
                            <span>{u.phoneNumber || '--'}</span>
                            {u.phoneNumber && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.phoneNumber, 'Phone')}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition"
                                title="Copy Phone Number"
                              >
                                <Copy size={11} />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-zinc-300">
                          {u.city || 'Delhi'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-xs">
                            <Coins size={12} />
                            <span>{u.coinBalance.toLocaleString('en-IN')}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              u.status === 'banned'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {u.status === 'banned' ? 'Banned' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 text-[11px]">
                          {formatDateTime(u.joinedAt)}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Preset Coin Grant */}
                            <button
                              type="button"
                              onClick={() => {
                                setCoinsModalUser(u)
                                setCoinsAmount(100)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-sm"
                            >
                              <PlusCircle size={12} />
                              <span>+ Coins</span>
                            </button>

                            {/* Dossier SideSheet */}
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 transition shadow-sm"
                            >
                              Dossier
                            </button>

                            {/* Ban / Unban Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleBan(u)}
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                                u.status === 'banned'
                                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                              }`}
                              title={u.status === 'banned' ? 'Restore access' : 'Restrict account'}
                            >
                              {u.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User CRM Dossier SideSheet */}
      <SideSheet
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Customer CRM Dossier"
        description="Comprehensive customer profile, wallet telemetry, and account history."
      >
        {selectedUser ? (
          <div className="space-y-5 text-xs">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-lg shadow-md">
                {(selectedUser.displayName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  {selectedUser.displayName}
                </h3>
                <p className="text-slate-400 font-mono text-[11px]">
                  User ID: {selectedUser.id}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      selectedUser.status === 'banned'
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {selectedUser.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="mt-1 font-mono font-bold text-slate-800 dark:text-white">
                  {selectedUser.phoneNumber || '--'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  App Presence
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-bold text-xs">
                  <span className={`h-2 w-2 rounded-full ${selectedUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className={selectedUser.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400'}>
                    {selectedUser.isOnline ? 'Online now in App' : (selectedUser.lastSeenAt ? `Seen ${formatDateTime(selectedUser.lastSeenAt)}` : 'Offline')}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Available Coins
                </p>
                <p className="mt-1 font-extrabold text-amber-500 text-sm">
                  {selectedUser.coinBalance.toLocaleString('en-IN')} Coins
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total App Calls
                </p>
                <p className="mt-1 font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                  {selectedUser.totalCalls ?? 0} Calls
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Coins Spent
                </p>
                <p className="mt-1 font-bold text-slate-800 dark:text-white text-xs">
                  {(selectedUser.totalSpentCoins ?? 0).toLocaleString('en-IN')} Coins
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Join Timestamp
                </p>
                <p className="mt-1 text-slate-600 dark:text-zinc-300 font-mono text-[11px]">
                  {formatDateTime(selectedUser.joinedAt)}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setCoinsModalUser(selectedUser)
                  setCoinsAmount(100)
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-md shadow-blue-600/30"
              >
                <PlusCircle size={15} />
                <span>Credit Bonus Coins to {selectedUser.displayName}</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleBan(selectedUser)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  selectedUser.status === 'banned'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                }`}
              >
                {selectedUser.status === 'banned' ? (
                  <>
                    <ShieldCheck size={15} />
                    <span>Unban &amp; Restore Account</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={15} />
                    <span>Ban Account &amp; Disconnect Calls</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </SideSheet>

      {/* Credit Coins Modal SideSheet */}
      <SideSheet
        open={Boolean(coinsModalUser)}
        onClose={() => setCoinsModalUser(null)}
        title="Credit Bonus Coins"
        description="Manual CRM ledger adjustment with cryptographic idempotency."
        widthClassName="max-w-md"
      >
        {coinsModalUser ? (
          <form onSubmit={handleAddCoins} className="space-y-4 text-xs">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-slate-500 dark:text-slate-400">Target Recipient:</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                {coinsModalUser.displayName} ({coinsModalUser.phoneNumber || 'User'})
              </p>
              <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                Current Balance: {coinsModalUser.coinBalance.toLocaleString('en-IN')} Coins
              </p>
            </div>

            <div>
              <span className="mb-1.5 block font-bold text-slate-700 dark:text-zinc-300">Quick Presets</span>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCoinsAmount(preset)}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      coinsAmount === preset
                        ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block font-bold text-slate-700 dark:text-zinc-300">Custom Coin Amount</span>
              <input
                type="number"
                min={1}
                max={50000}
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                required
              />
            </label>

            <button
              type="submit"
              disabled={savingCoins}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition disabled:opacity-60 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>{savingCoins ? 'Processing Credit...' : `Credit ${coinsAmount} Coins Now`}</span>
            </button>
          </form>
        ) : null}
      </SideSheet>
    </div>
  )
}
