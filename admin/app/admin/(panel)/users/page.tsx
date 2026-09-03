'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getAvatarUrl } from '@/lib/avatar'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import SideSheet from '@/components/admin/SideSheet'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { AdminUserRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/admin/format'
import { Download } from 'lucide-react'

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [coinsModalUser, setCoinsModalUser] = useState<AdminUserRow | null>(null)
  const [coinsAmount, setCoinsAmount] = useState(100)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ users: AdminUserRow[] }>('/api/admin/users/list')
      setUsers(response.users)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) =>
      [user.displayName, user.username, user.phoneNumber].some((value) =>
        value.toLowerCase().includes(query)
      )
    )
  }, [search, users])

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
      toast.success('Coins added successfully')
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
      toast.success(user.status === 'banned' ? 'User restored' : 'User banned')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user status')
    }
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
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `friendoo-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="User Management"
        description="Search users, adjust balances, and ban accounts when needed."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2 rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        }
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, username, or phone"
          className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-purple-500 md:max-w-sm"
        />
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <SectionCard>
          {filteredUsers.length === 0 ? (
            <DataState
              title="No users found"
              body="Try a different search query. This list excludes host accounts."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">Avatar</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Username</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">City</th>
                    <th className="px-3 py-3 font-medium">Coin Balance</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Joined</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#202020]">
                      <td className="px-3 py-4">
                        <Image
                          src={user.avatarSeed ? getAvatarUrl(user.avatarSeed, 80) : user.photoURL || getAvatarUrl(user.id, 80)}
                          alt={user.displayName}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-3 py-4 font-medium text-white">{user.displayName}</td>
                      <td className="px-3 py-4 text-zinc-300">{user.username || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{user.phoneNumber || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{user.city || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{user.coinBalance.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4">
                        <Badge label={user.status} variant={user.status === 'banned' ? 'banned' : 'active'} />
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{formatDateTime(user.joinedAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-lg border border-[#343434] px-3 py-1.5 text-xs font-medium text-zinc-200"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoinsModalUser(user)}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200"
                          >
                            Add Coins
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBan(user)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                              user.status === 'banned'
                                ? 'border border-green-500/30 bg-green-500/10 text-green-300'
                                : 'border border-red-500/30 bg-red-500/10 text-red-300'
                            }`}
                          >
                            {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <SideSheet
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="User Profile"
        description="Profile snapshot from the user collection."
        widthClassName="max-w-lg"
      >
        {selectedUser ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Display Name</p>
              <p className="mt-2 text-base font-semibold text-white">{selectedUser.displayName}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Username</p>
                <p className="mt-2 text-white">{selectedUser.username || '--'}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Phone</p>
                <p className="mt-2 text-white">{selectedUser.phoneNumber || '--'}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">City</p>
                <p className="mt-2 text-white">{selectedUser.city || '--'}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Balance</p>
                <p className="mt-2 text-white">{selectedUser.coinBalance.toLocaleString('en-IN')} coins</p>
              </div>
            </div>
          </div>
        ) : null}
      </SideSheet>

      <SideSheet
        open={Boolean(coinsModalUser)}
        onClose={() => setCoinsModalUser(null)}
        title="Add Coins"
        description="Grant bonus coins and create a bonus transaction log."
        widthClassName="max-w-md"
      >
        {coinsModalUser ? (
          <form onSubmit={addCoins} className="space-y-4">
            <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4 text-sm text-zinc-300">
              Adding coins to <span className="font-semibold text-white">{coinsModalUser.displayName}</span>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Amount</span>
              <input
                type="number"
                min={1}
                value={coinsAmount}
                onChange={(event) => setCoinsAmount(Number(event.target.value))}
                className="w-full rounded-2xl border border-[#343434] bg-[#111111] px-4 py-3 text-white outline-none focus:border-purple-500"
                required
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Add Coins'}
            </button>
          </form>
        ) : null}
      </SideSheet>
    </div>
  )
}
