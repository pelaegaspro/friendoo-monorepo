'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getAvatarUrl } from '@/lib/avatar'
import SectionCard from '@/components/admin/SectionCard'
import StatCard from '@/components/admin/StatCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import SideSheet from '@/components/admin/SideSheet'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { AdminUserRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import {
  Download,
  Search,
  UserRound,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Copy,
  PlusCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'zero' | 'banned'>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [coinsModalUser, setCoinsModalUser] = useState<AdminUserRow | null>(null)
  const [coinsAmount, setCoinsAmount] = useState(100)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ users: AdminUserRow[] }>('/api/admin/users/list')
      setUsers(response.users || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [])

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

  const totalBalance = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.coinBalance || 0), 0)
  }, [users])

  const addCoins = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!coinsModalUser) return
    setSaving(true)
    try {
      await adminFetch('/api/admin/users/addCoins', {
        method: 'POST',
        body: JSON.stringify({
          userId: coinsModalUser.id,
          amountCoins: coinsAmount,
          idempotencyKey: `admin_adjust:${coinsModalUser.id}:${crypto.randomUUID()}`,
        }),
      })
      toast.success(`Successfully added ${coinsAmount} coins to ${coinsModalUser.displayName}`)
      setCoinsModalUser(null)
      setCoinsAmount(100)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add coins')
    } finally {
      setSaving(false)
    }
  }

  const toggleBan = async (user: AdminUserRow) => {
    try {
      await adminFetch('/api/admin/users/ban', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          isBanned: user.status !== 'banned',
        }),
      })
      toast.success(user.status === 'banned' ? 'User access restored' : 'User account banned')
      await load()
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

  return (
    <div className="space-y-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#171321] via-[#11111a] to-[#10151b] p-5 shadow-[0_24px_80px_-45px_rgba(139,92,246,0.5)] sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-24 -z-10 h-64 w-64 rounded-full bg-violet-500/20 blur-[90px]" />
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.8)]" />
          Customer workspace
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Customer CRM</h1>
        <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-zinc-400">
          Review accounts, wallet balances, and customer access.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={users.length.toLocaleString('en-IN')}
          icon={UserRound}
          color="blue"
          variant="glass"
          helper="Registered non-host accounts"
        />

        <StatCard
          label="Client Balances"
          value={`${totalBalance.toLocaleString('en-IN')} Coins`}
          icon={Coins}
          color="purple"
          variant="glass"
          helper="Active coin liability"
        />

        <StatCard
          label="Funded Accounts"
          value={users.filter((u) => u.coinBalance > 0).length.toLocaleString('en-IN')}
          icon={TrendingUp}
          color="orange"
          variant="glass"
          helper="With coin balance > 0"
        />

        <StatCard
          label="Restricted Accounts"
          value={users.filter((u) => u.status === 'banned').length.toLocaleString('en-IN')}
          icon={ShieldAlert}
          color="rose"
          variant="glass"
          helper="Accounts currently restricted"
        />
      </div>

      {/* Search, Filter Tabs & Export */}
      <SectionCard
        title="Customer Relationship Management"
        description="Search clients, inspect profiles, adjust balances, and maintain platform trust."
        badge="CRM Directory"
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone (+91...), city..."
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('positive')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'positive'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Funded (&gt;0)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('zero')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'zero'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Zero Balance
            </button>
            <button
              type="button"
              onClick={() => setFilterType('banned')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'banned'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Banned
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Main CRM User Table */}
      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <SectionCard>
          {filteredUsers.length === 0 ? (
            <DataState
              title="No customers match criteria"
              body="Try resetting your filters or adjusting your search phrase."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="px-3.5 py-3.5">Customer</th>
                    <th className="px-3.5 py-3.5">Contact</th>
                    <th className="px-3.5 py-3.5">Location</th>
                    <th className="px-3.5 py-3.5">Wallet Balance</th>
                    <th className="px-3.5 py-3.5">Account Status</th>
                    <th className="px-3.5 py-3.5">Registered</th>
                    <th className="px-3.5 py-3.5 text-right">CRM Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => {
                    const initials = (user.displayName || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-white/[0.03]"
                      >
                        {/* Customer Avatar & Name */}
                        <td className="px-3.5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1e2235]">
                              {user.avatarSeed || user.photoURL ? (
                                <Image
                                  src={
                                    user.avatarSeed
                                      ? getAvatarUrl(user.avatarSeed, 80)
                                      : user.photoURL || getAvatarUrl(user.id, 80)
                                  }
                                  alt={user.displayName}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-300">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">
                                {user.displayName}
                              </p>
                              <p className="text-[11px] text-zinc-400 font-mono">
                                @{user.username || 'user'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone Contact */}
                        <td className="px-3.5 py-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                            <span>{user.phoneNumber || '--'}</span>
                            {user.phoneNumber && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(user.phoneNumber, 'Phone')}
                                className="text-zinc-500 hover:text-zinc-300 transition"
                                title="Copy Phone Number"
                              >
                                <Copy size={12} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* City / Location */}
                        <td className="px-3.5 py-3.5 text-zinc-300">
                          {user.city || 'India'}
                        </td>

                        {/* Coin Balance */}
                        <td className="px-3.5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              user.coinBalance > 0
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Coins size={12} />
                            <span>{user.coinBalance.toLocaleString('en-IN')} Coins</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3.5 py-3.5">
                          <Badge
                            label={user.status}
                            variant={user.status === 'banned' ? 'banned' : 'active'}
                          />
                        </td>

                        {/* Registered Date */}
                        <td className="px-3.5 py-3.5 text-zinc-400 font-mono text-[11px]">
                          {formatDateTime(user.joinedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                            >
                              CRM Snapshot
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCoinsModalUser(user)
                                setCoinsAmount(100)
                              }}
                              className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20"
                            >
                              + Coins
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBan(user)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                user.status === 'banned'
                                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                              }`}
                            >
                              {user.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Customer CRM Profile Snapshot SideSheet */}
      <SideSheet
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Customer CRM Snapshot"
        description="Comprehensive client account record from Friendoo database."
        widthClassName="max-w-md"
      >
        {selectedUser ? (
          <div className="space-y-4 text-xs">
            {/* Header Identity Card */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#161826] p-4.5">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-purple-950/40">
                <Image
                  src={
                    selectedUser.avatarSeed
                      ? getAvatarUrl(selectedUser.avatarSeed, 100)
                      : selectedUser.photoURL || getAvatarUrl(selectedUser.id, 100)
                  }
                  alt={selectedUser.displayName}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-base font-bold text-white">{selectedUser.displayName}</p>
                <p className="font-mono text-zinc-400">@{selectedUser.username || 'user'}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    label={selectedUser.status}
                    variant={selectedUser.status === 'banned' ? 'banned' : 'active'}
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ID: {selectedUser.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Parameters Bento */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-[#141624] p-3.5">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="mt-1 font-mono font-semibold text-white">
                  {selectedUser.phoneNumber || '--'}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141624] p-3.5">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  City Location
                </p>
                <p className="mt-1 font-semibold text-white">
                  {selectedUser.city || 'India'}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141624] p-3.5">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Available Coins
                </p>
                <p className="mt-1 font-bold text-amber-400 text-sm">
                  {selectedUser.coinBalance.toLocaleString('en-IN')} Coins
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141624] p-3.5">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Join Timestamp
                </p>
                <p className="mt-1 text-zinc-300 font-mono text-[11px]">
                  {formatDateTime(selectedUser.joinedAt)}
                </p>
              </div>
            </div>

            {/* Quick Actions in SideSheet */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setCoinsModalUser(selectedUser)
                  setCoinsAmount(100)
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-purple-500 shadow-md shadow-purple-600/30"
              >
                <PlusCircle size={15} />
                <span>Credit Bonus Coins to {selectedUser.displayName}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleBan(selectedUser)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  selectedUser.status === 'banned'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                }`}
              >
                {selectedUser.status === 'banned' ? (
                  <>
                    <ShieldCheck size={15} />
                    <span>Unban & Restore Account</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={15} />
                    <span>Ban Account & Terminate Active Calls</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </SideSheet>

      {/* Credit Coins Modal SideSheet with Presets */}
      <SideSheet
        open={Boolean(coinsModalUser)}
        onClose={() => setCoinsModalUser(null)}
        title="Credit Bonus Coins"
        description="Manual CRM ledger adjustment with cryptographic idempotency."
        widthClassName="max-w-md"
      >
        {coinsModalUser ? (
          <form onSubmit={addCoins} className="space-y-4 text-xs">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <p className="text-zinc-400">Target Recipient:</p>
              <p className="mt-1 text-sm font-bold text-white">
                {coinsModalUser.displayName} ({coinsModalUser.phoneNumber || 'User'})
              </p>
              <p className="mt-1 text-[11px] text-purple-300 font-semibold">
                Current Balance: {coinsModalUser.coinBalance.toLocaleString('en-IN')} Coins
              </p>
            </div>

            <div>
              <span className="mb-1.5 block font-semibold text-zinc-300">Quick Presets</span>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCoinsAmount(preset)}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      coinsAmount === preset
                        ? 'border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/30'
                        : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block font-semibold text-zinc-300">Custom Coin Amount</span>
              <input
                type="number"
                min={1}
                max={50000}
                value={coinsAmount}
                onChange={(event) => setCoinsAmount(Number(event.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
                required
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-purple-500 disabled:opacity-60 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>{saving ? 'Processing Credit...' : `Credit ${coinsAmount} Coins Now`}</span>
            </button>
          </form>
        ) : null}
      </SideSheet>
    </div>
  )
}
