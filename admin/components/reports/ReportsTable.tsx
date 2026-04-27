'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Report } from '@/types'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils/formatters'
import ReportDetailModal from './ReportDetailModal'
import { MoreVertical } from 'lucide-react'

interface ReportsTableProps {
  reports: Report[]
  onAction: (action: string, id: string, note?: string) => void
}

type StatusFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'dismissed'
type PriorityFilter = 'all' | 'high' | 'medium' | 'low'

const PAGE_SIZE = 20

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
]

const priorityFilters: { key: PriorityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

export default function ReportsTable({ reports, onAction }: ReportsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [page, setPage] = useState(1)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [detailReport, setDetailReport] = useState<Report | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{ id: string } | null>(null)
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
    let list = [...reports]
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter((r) => r.priority === priorityFilter)
    return list
  }, [reports, statusFilter, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const priorityBtnClass = (key: PriorityFilter) => {
    const active = priorityFilter === key
    if (!active) return 'px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors'
    const colors: Record<PriorityFilter, string> = {
      all: 'bg-purple-600 border-purple-500 text-white',
      high: 'bg-red-600/30 border-red-500/50 text-red-400',
      medium: 'bg-yellow-600/30 border-yellow-500/50 text-yellow-400',
      low: 'bg-gray-600/30 border-gray-500/50 text-gray-300',
    }
    return `px-3 py-1.5 text-xs rounded-lg border ${colors[key]} transition-colors`
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.key
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Priority:</span>
        {priorityFilters.map((p) => (
          <button
            key={p.key}
            onClick={() => { setPriorityFilter(p.key); setPage(1) }}
            className={priorityBtnClass(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Report ID</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Reporter</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Reported</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Reason</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Description</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Priority</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  No reports found
                </td>
              </tr>
            ) : (
              paginated.map((report) => (
                <tr key={report.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    #{report.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{report.reporterName}</p>
                      <p className="text-gray-500 text-xs font-mono">{report.reporterId.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{report.reportedName}</p>
                      <p className="text-gray-500 text-xs font-mono">{report.reportedId.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{report.reason}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px]">
                    <span title={report.description}>
                      {report.description.length > 50
                        ? report.description.slice(0, 50) + '…'
                        : report.description}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={report.status} variant={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={report.priority} variant={report.priority} />
                  </td>
                  {/* Actions dropdown */}
                  <td
                    className="px-4 py-3 relative"
                    ref={openDropdown === report.id ? dropdownRef : undefined}
                  >
                    <button
                      onClick={() => setOpenDropdown(openDropdown === report.id ? null : report.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdown === report.id && (
                      <div className="absolute right-4 top-10 z-20 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl py-1">
                        <button
                          onClick={() => { setOpenDropdown(null); setDetailReport(report) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          View Full Report
                        </button>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('investigating', report.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors"
                        >
                          Mark Investigating
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); setResolveDialog({ id: report.id }) }}
                          className="w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-gray-700 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('dismiss', report.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          Dismiss
                        </button>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('ban', report.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          Ban Reported User
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('warning', report.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-orange-400 hover:bg-gray-700 transition-colors"
                        >
                          Send Warning Email
                        </button>
                        <button
                          onClick={() => { setOpenDropdown(null); onAction('update', report.id) }}
                          className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors"
                        >
                          Send Update to Reporter
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

      {/* Detail modal */}
      <ReportDetailModal
        report={detailReport}
        isOpen={!!detailReport}
        onClose={() => setDetailReport(null)}
        onAction={onAction}
      />

      {/* Resolve confirm dialog */}
      {resolveDialog && (
        <ConfirmDialog
          isOpen={!!resolveDialog}
          onClose={() => setResolveDialog(null)}
          onConfirm={(note) => { onAction('resolve', resolveDialog.id, note); setResolveDialog(null) }}
          title="Resolve Report"
          message="Add a resolution note for this report."
          confirmLabel="Resolve"
          confirmVariant="primary"
          requireReason
          reasonPlaceholder="Describe how this was resolved..."
        />
      )}
    </div>
  )
}
