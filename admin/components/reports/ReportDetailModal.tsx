'use client'

import { useState } from 'react'
import { Report, ActionEntry } from '@/types'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'
import { ExternalLink } from 'lucide-react'

interface ReportDetailModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: string, reportId: string, note?: string) => void
}

export default function ReportDetailModal({ report, isOpen, onClose, onAction }: ReportDetailModalProps) {
  const [adminNote, setAdminNote] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [showResolveInput, setShowResolveInput] = useState(false)

  if (!report) return null

  const handleAction = (action: string, note?: string) => {
    onAction(action, report.id, note)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report #${report.id.slice(0, 8)}`} size="xl">
      <div className="space-y-6">
        {/* Header badges */}
        <div className="flex items-center gap-3">
          <Badge label={report.status} variant={report.status} />
          <Badge label={report.priority} variant={report.priority} />
        </div>

        {/* Reporter / Reported */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Reporter</p>
            <p className="text-white font-medium">{report.reporterName}</p>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">{report.reporterId}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Reported User</p>
            <p className="text-white font-medium">{report.reportedName}</p>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">{report.reportedId}</p>
          </div>
        </div>

        {/* Reason & Description */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Reason</p>
            <p className="text-white">{report.reason}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-gray-300 text-sm leading-relaxed">{report.description}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Submitted</p>
            <p className="text-gray-300 text-sm">{formatDate(report.createdAt)}</p>
          </div>
        </div>

        {/* Evidence URLs */}
        {report.evidenceURLs && report.evidenceURLs.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Evidence</p>
            <div className="space-y-1">
              {report.evidenceURLs.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  <ExternalLink size={13} />
                  {url.length > 60 ? url.slice(0, 60) + '…' : url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Admin Notes</p>
          <textarea
            value={adminNote || report.adminNotes || ''}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add internal notes..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Action History */}
        {report.actionHistory && report.actionHistory.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Action History</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {report.actionHistory.map((entry: ActionEntry, i: number) => (
                <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-medium capitalize">{entry.action}</span>
                    <span className="text-gray-500 text-xs">{formatDate(entry.timestamp)}</span>
                  </div>
                  {entry.note && <p className="text-gray-400 text-xs mt-0.5">{entry.note}</p>}
                  <p className="text-gray-500 text-xs mt-0.5 font-mono">by {entry.adminId}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolve note input */}
        {showResolveInput && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <p className="text-sm text-white font-medium">Resolution Note</p>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Describe how this was resolved..."
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('resolve', resolveNote)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                Confirm Resolve
              </button>
              <button
                onClick={() => setShowResolveInput(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!showResolveInput && (
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAction('investigating')}
                className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 text-sm rounded-lg transition-colors"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => setShowResolveInput(true)}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30 text-sm rounded-lg transition-colors"
              >
                Resolve
              </button>
              <button
                onClick={() => handleAction('dismiss')}
                className="px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 border border-gray-600/30 text-sm rounded-lg transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction('ban')}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-sm rounded-lg transition-colors"
              >
                Ban Reported User
              </button>
              <button
                onClick={() => handleAction('warning')}
                className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 text-sm rounded-lg transition-colors"
              >
                Send Warning Email
              </button>
              <button
                onClick={() => handleAction('update')}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 text-sm rounded-lg transition-colors"
              >
                Send Update to Reporter
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
