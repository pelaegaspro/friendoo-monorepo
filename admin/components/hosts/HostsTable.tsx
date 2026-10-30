'use client'

import Image from 'next/image'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Host } from '@/types'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib/utils/formatters'
import HostProfileModal from './HostProfileModal'
import { MoreVertical, Star, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface HostsTableProps {
  hosts: Host[]
  onAction: (action: string, id: string, reason?: string) => void
  initialFilter?: string
}

type FilterTab = 'all' | 'pending' | 'active' | 'suspended'

const PAGE_SIZE = 20

import { getAppAvatarUrl } from '@/lib/avatar'

export default function HostsTable({ hosts, onAction, initialFilter }: HostsTableProps) {
  const [filter, setFilter] = useState<FilterTab>(
    (['all', 'pending', 'active', 'suspended'].includes(initialFilter ?? '') ? initialFilter : 'all') as FilterTab
  )
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [profileHost, setProfileHost] = useState<Host | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null)
  const dropdownRef = useRef<HTMLTableCellElement>(null)

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
    let list = [...hosts]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.phone?.includes(q) ||
          h.email?.toLowerCase().includes(q) ||
          h.category?.toLowerCase().includes(q)
      )
    }
    if (filter !== 'all') list = list.filter((h) => h.status === filter)
    return list
  }, [hosts, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, phone, category..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(1) }}
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
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Host</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Languages</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Rating</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Earnings</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  No hosts found
                </td>
              </tr>
            ) : (
              paginated.map((host) => (
                <tr key={host.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  {/* Avatar + Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getAppAvatarUrl(host.photoURL) ? (
                        <Image
                          src={getAppAvatarUrl(host.photoURL)!}
                          alt={host.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-950/50 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                          {(host.name || 'H').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-white font-medium">{host.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{host.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{host.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {host.languages?.length ? host.languages.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{host.rating?.toFixed(1) ?? '—'}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{formatCurrency(host.totalEarnings ?? 0)}</td>
                  <td className="px-4 py-3">
                    <Badge label={host.status} variant={host.status} />
                  </td>
                  {/* Actions dropdown */}
                  <td
                    className="px-4 py-3 relative"
                    ref={openDropdown === host.id ? dropdownRef : undefined}
                  >
                    <button
                      onClick={() => setOpenDropdown(openDropdown === host.id ? null : host.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdown === host.id && (
                      <div className="absolute right-4 top-10 z-20 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1">
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('approve', host.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Approve Host
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); setRejectDialog({ id: host.id }) }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                        >
                          Reject Host
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('suspend', host.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Suspend Host
                        </button>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={() => { setOpenDropdown(null); setProfileHost(host) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); toast('Coming soon') }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Earnings
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); toast('Coming soon') }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Reviews
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
      <HostProfileModal
        host={profileHost}
        isOpen={!!profileHost}
        onClose={() => setProfileHost(null)}
      />

      {/* Reject confirm dialog */}
      {rejectDialog && (
        <ConfirmDialog
          isOpen={!!rejectDialog}
          onClose={() => setRejectDialog(null)}
          onConfirm={(reason) => { onAction('reject', rejectDialog.id, reason); setRejectDialog(null) }}
          title="Reject Host"
          message="Please provide a reason for rejecting this host application."
          confirmLabel="Reject"
          confirmVariant="danger"
          requireReason
          reasonPlaceholder="Enter rejection reason..."
        />
      )}
    </div>
  )
}
