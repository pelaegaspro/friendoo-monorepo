'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppUser } from '@/types'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters'
import UserProfileModal from './UserProfileModal'
import { ChevronDown, Search, MoreVertical } from 'lucide-react'

interface UsersTableProps {
  users: AppUser[]
  onAction: (action: string, uid: string, extra?: string) => void
}

const PAGE_SIZE = 20

type FilterTab = 'all' | 'active' | 'banned' | 'suspended' | 'verified'
type SortKey = 'createdAt' | 'name' | 'lastActive'

import { getAvatarUrl } from '@/lib/avatar'

export default function UsersTable({ users, onAction }: UsersTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [page, setPage] = useState(1)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [profileUser, setProfileUser] = useState<AppUser | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    action: string; uid: string; title: string; message: string
  } | null>(null)
  const dropdownRef = useRef<HTMLTableCellElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    let list = [...users]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      )
    }

    // Filter tab
    if (filter === 'active') list = list.filter((u) => u.status === 'active')
    else if (filter === 'banned') list = list.filter((u) => u.status === 'banned')
    else if (filter === 'suspended') list = list.filter((u) => u.status === 'suspended')
    else if (filter === 'verified') list = list.filter((u) => u.isVerified)

    // Sort
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'lastActive') {
        const at = a.lastActive?.toMillis() ?? 0
        const bt = b.lastActive?.toMillis() ?? 0
        return bt - at
      }
      // createdAt
      const ac = a.createdAt?.toMillis() ?? 0
      const bc = b.createdAt?.toMillis() ?? 0
      return bc - ac
    })

    return list
  }, [users, search, filter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = (tab: FilterTab) => {
    setFilter(tab)
    setPage(1)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const triggerAction = (action: string, uid: string) => {
    setOpenDropdown(null)
    const confirmMap: Record<string, { title: string; message: string }> = {
      ban: { title: 'Ban User', message: 'Are you sure you want to ban this user?' },
      suspend: { title: 'Suspend User', message: 'Are you sure you want to suspend this user?' },
      delete: { title: 'Delete User', message: 'This action is irreversible. Delete this user?' },
      verify: { title: 'Verify User', message: 'Mark this user as verified?' },
    }
    if (confirmMap[action]) {
      setConfirmDialog({ action, uid, ...confirmMap[action] })
    } else {
      onAction(action, uid)
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'banned', label: 'Banned' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'verified', label: 'Verified' },
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="createdAt">Join Date</option>
            <option value="name">Name</option>
            <option value="lastActive">Last Active</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === tab.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Last Active</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              paginated.map((user) => (
                <tr key={user.uid} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  {/* Avatar + Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarSeed ? getAvatarUrl(user.avatarSeed, 64) : user.photoURL || getAvatarUrl(user.uid, 64)}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatRelativeDate(user.lastActive)}</td>
                  <td className="px-4 py-3">
                    <Badge label={user.role} variant="default" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={user.status} variant={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    {user.isVerified ? <Badge label="Verified" variant="verified" /> : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  {/* Actions dropdown */}
                  <td className="px-4 py-3 relative" ref={openDropdown === user.uid ? dropdownRef : undefined}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === user.uid ? null : user.uid)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdown === user.uid && (
                      <div className="absolute right-4 top-10 z-20 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1">
                        <button
                          onClick={() => { setOpenDropdown(null); setProfileUser(user) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Full Profile
                        </button>
                        <button
                          onClick={() => triggerAction('verify', user.uid)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Verify User
                        </button>
                        <button
                          onClick={() => triggerAction('ban', user.uid)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Ban User
                        </button>
                        <button
                          onClick={() => triggerAction('suspend', user.uid)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Suspend User
                        </button>
                        <button
                          onClick={() => triggerAction('delete', user.uid)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                        >
                          Delete User
                        </button>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={() => { setOpenDropdown(null); router.push('/dashboard/emails') }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Send Email
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('viewBookings', user.uid) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Bookings
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('viewReports', user.uid) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Reports
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    pageNum === page
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Profile modal */}
      <UserProfileModal
        user={profileUser}
        isOpen={!!profileUser}
        onClose={() => setProfileUser(null)}
        onAction={(action, uid) => { setProfileUser(null); triggerAction(action, uid) }}
      />

      {/* Confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => { onAction(confirmDialog.action, confirmDialog.uid); setConfirmDialog(null) }}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.action === 'delete' ? 'Delete' : 'Confirm'}
          confirmVariant={confirmDialog.action === 'delete' ? 'danger' : 'primary'}
        />
      )}
    </div>
  )
}
