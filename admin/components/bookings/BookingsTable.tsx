'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Search } from 'lucide-react'
import { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { formatDate, formatMinutes, formatCurrency } from '@/lib/utils/formatters'
import toast from 'react-hot-toast'

interface BookingsTableProps {
  bookings: Booking[]
  onAction: (action: string, id: string) => void
}

type StatusFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled'

const STATUS_TABS: StatusFilter[] = ['all', 'pending', 'active', 'completed', 'cancelled']

export default function BookingsTable({ bookings, onAction }: BookingsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase()
    if (q && !b.userName.toLowerCase().includes(q) && !b.hostName.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (dateFrom || dateTo) {
      const ts = b.scheduledAt?.toDate?.()
      if (!ts) return false
      if (dateFrom && ts < new Date(dateFrom)) return false
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (ts > to) return false
      }
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search + Date filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user or host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              statusFilter === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              {['Booking ID', 'User', 'Host', 'Date/Time', 'Duration', 'Amount', 'Status', 'Payment', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">No bookings found</td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-white">{b.userName}</td>
                  <td className="px-4 py-3 text-white">{b.hostName}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(b.scheduledAt)}</td>
                  <td className="px-4 py-3 text-gray-300">{formatMinutes(b.duration)}</td>
                  <td className="px-4 py-3 text-gray-300">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge label={b.status} variant={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={b.paymentStatus} variant={b.paymentStatus as 'pending' | 'paid' | 'refunded'} />
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === b.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-4 top-10 z-20 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1"
                      >
                        <button
                          onClick={() => { setDetailsBooking(b); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => { onAction('cancel', b.id); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Cancel Booking
                        </button>
                        <button
                          onClick={() => { onAction('refund', b.id); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Refund Payment
                        </button>
                        <button
                          onClick={() => { toast('No recording available'); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          View Call Recording
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

      {/* Details Modal */}
      <Modal isOpen={!!detailsBooking} onClose={() => setDetailsBooking(null)} title="Booking Details" size="md">
        {detailsBooking && (
          <div className="space-y-3 text-sm">
            {[
              ['Booking ID', detailsBooking.id],
              ['User', detailsBooking.userName],
              ['User ID', detailsBooking.userId],
              ['Host', detailsBooking.hostName],
              ['Host ID', detailsBooking.hostId],
              ['Scheduled At', formatDate(detailsBooking.scheduledAt)],
              ['Duration', formatMinutes(detailsBooking.duration)],
              ['Amount', formatCurrency(detailsBooking.amount)],
              ['Status', detailsBooking.status],
              ['Payment Status', detailsBooking.paymentStatus],
              ['Call ID', detailsBooking.callId ?? '—'],
              ['Created At', formatDate(detailsBooking.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-gray-700/50 pb-2">
                <span className="text-gray-400 shrink-0">{label}</span>
                <span className="text-white text-right break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
