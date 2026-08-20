'use client'

import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { Payment } from '@/types'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { exportToCSV } from '@/lib/utils/csv'

interface PaymentsTableProps {
  payments: Payment[]
}

type StatusFilter = 'all' | 'captured' | 'refunded' | 'failed'

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const pId = (p as any).cashfreeId || "";
      if (search && !pId.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false

      const date = p.createdAt?.toDate()
      if (fromDate && date && date < new Date(fromDate)) return false
      if (toDate && date && date > new Date(toDate + 'T23:59:59')) return false

      const minPaise = minAmount ? parseFloat(minAmount) * 100 : null
      const maxPaise = maxAmount ? parseFloat(maxAmount) * 100 : null
      if (minPaise !== null && p.amount < minPaise) return false
      if (maxPaise !== null && p.amount > maxPaise) return false

      return true
    })
  }, [payments, search, statusFilter, fromDate, toDate, minAmount, maxAmount])

  function handleExport() {
    const rows = filtered.map((p) => ({
      ID: p.id,
      'Payment ID': (p as any).cashfreeId || "",
      User: p.userName,
      Amount: formatCurrency(p.amount),
      Date: formatDate(p.createdAt),
      Status: p.status,
      Type: p.type,
    }))
    exportToCSV(rows, 'payments')
  }

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Captured', value: 'captured' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Amount range */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min ₹"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <span className="text-gray-500 text-sm">–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Download size={16} />
          Export to CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Internal ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Gateway ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date / Time</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                   const gId = (p as any).cashfreeId || "—";
                   return (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                      {p.id.slice(0, 12)}…
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                      {gId.length > 16 ? gId.slice(0, 16) + "…" : gId}
                    </td>
                    <td className="px-4 py-3 text-white">{p.userName}</td>
                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge label={p.status} variant={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={p.type} variant="default" />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            {[
              { label: 'Payment ID', value: selectedPayment.id },
              { label: 'Gateway ID', value: (selectedPayment as any).cashfreeId || "—" },
              { label: 'User', value: selectedPayment.userName },
              { label: 'Amount', value: formatCurrency(selectedPayment.amount) },
              { label: 'Date', value: formatDate(selectedPayment.createdAt) },
              { label: 'Type', value: selectedPayment.type },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-gray-400 text-sm shrink-0">{label}</span>
                <span className="text-white text-sm text-right break-all">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-400 text-sm">Status</span>
              <Badge label={selectedPayment.status} variant={selectedPayment.status} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
