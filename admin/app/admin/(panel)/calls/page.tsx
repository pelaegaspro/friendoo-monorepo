'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import SideSheet from '@/components/admin/SideSheet'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { CallRow, CallStatus } from '@/lib/admin/types'
import { formatDateTime, formatDuration } from '@/lib/admin/format'
import { Download } from 'lucide-react'

function downloadCsv(rows: CallRow[]) {
  const header = ['Caller', 'Caller Phone', 'Host', 'Host Phone', 'Type', 'Duration', 'Coins Spent', 'Status', 'End Reason', 'Date', 'Channel']
  const lines = rows.map((row) =>
    [
      row.callerName,
      row.callerPhone ?? '',
      row.hostName,
      row.hostPhone ?? '',
      row.callType ?? 'audio',
      formatDuration(row.durationSeconds),
      row.coinsSpent,
      row.status,
      row.endReason ?? '',
      row.createdAt ?? '',
      row.agoraChannel,
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  )

  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `friendoo-calls-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function CallsAdminPage() {
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | CallStatus>('all')
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ calls?: CallRow[] }>('/api/admin/calls/list')
      setCalls(
        Array.isArray(response?.calls)
          ? response.calls
          : Array.isArray(response)
          ? (response as unknown as CallRow[])
          : []
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load calls')
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [])

  const filteredCalls = useMemo(
    () => (Array.isArray(calls) ? calls : []).filter((call) => (statusFilter === 'all' ? true : call.status === statusFilter)),
    [calls, statusFilter]
  )

  return (
    <div className="space-y-6">
      <SectionCard
        title="Call History & WebRTC Logs"
        description="Monitor active, ended, missed, and rejected calls with full participant and billing telemetry."
        actions={
          <button
            type="button"
            onClick={() => downloadCsv(filteredCalls)}
            disabled={filteredCalls.length === 0}
            className="flex items-center gap-2 rounded-xl border border-[#343434] bg-[#111111] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'ended', 'missed', 'rejected', 'ringing'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-2 text-sm transition ${
                statusFilter === status
                  ? 'bg-purple-500/15 text-purple-200 ring-1 ring-purple-500/30'
                  : 'border border-[#343434] bg-[#111111] text-zinc-400'
              }`}
            >
              {status === 'all' ? `All (${(calls || []).length})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${(calls || []).filter(c => c.status === status).length})`}
            </button>
          ))}
        </div>
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <SectionCard>
          {filteredCalls.length === 0 ? (
            <DataState title="No calls found" body="Try a different status filter or check back after users initiate calls." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">Caller</th>
                    <th className="px-3 py-3 font-medium">Host</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Duration</th>
                    <th className="px-3 py-3 font-medium">Coins Deducted</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      className="cursor-pointer border-b border-[#202020] transition hover:bg-[#151515]"
                      onClick={() => setSelectedCall(call)}
                    >
                      <td className="px-3 py-4 font-medium text-white">
                        <div>{call.callerName}</div>
                        {call.callerPhone ? <div className="text-xs text-zinc-500">{call.callerPhone}</div> : null}
                      </td>
                      <td className="px-3 py-4 text-zinc-300">
                        <div>{call.hostName}</div>
                        {call.hostPhone ? <div className="text-xs text-zinc-500">{call.hostPhone}</div> : null}
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400 uppercase">
                          {call.callType || 'audio'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{formatDuration(call.durationSeconds ?? 0)}</td>
                      <td className="px-3 py-4 text-zinc-300">{(call.coinsSpent ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4">
                        <Badge
                          label={call.status}
                          variant={
                            call.status === 'active' || call.status === 'ringing'
                              ? 'active'
                              : call.status === 'ended'
                              ? 'completed'
                              : 'danger'
                          }
                        />
                      </td>
                      <td className="px-3 py-4 text-zinc-300">{formatDateTime(call.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      <SideSheet
        open={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
        title="Call Details & Diagnostics"
        description="Full metadata and session telemetry for the selected call."
        widthClassName="max-w-lg"
      >
        {selectedCall ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Caller</p>
                <p className="mt-2 font-medium text-white">{selectedCall.callerName}</p>
                {selectedCall.callerPhone ? <p className="text-xs text-zinc-400">{selectedCall.callerPhone}</p> : null}
                <p className="mt-1 font-mono text-[10px] text-zinc-600 truncate">{selectedCall.callerId}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Host</p>
                <p className="mt-2 font-medium text-white">{selectedCall.hostName}</p>
                {selectedCall.hostPhone ? <p className="text-xs text-zinc-400">{selectedCall.hostPhone}</p> : null}
                <p className="mt-1 font-mono text-[10px] text-zinc-600 truncate">{selectedCall.hostId}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Status & Type</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    label={selectedCall.status}
                    variant={
                      selectedCall.status === 'active' || selectedCall.status === 'ringing'
                        ? 'active'
                        : selectedCall.status === 'ended'
                        ? 'completed'
                        : 'danger'
                    }
                  />
                  <span className="text-xs text-zinc-400 uppercase font-mono">
                    {selectedCall.callType || 'audio'}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">End Reason</p>
                <p className="mt-2 font-mono text-xs text-white">
                  {selectedCall.endReason || (selectedCall.status === 'active' ? 'Active Session' : 'Normal Hangup')}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">RTC Signaling Channel</p>
              <p className="mt-2 break-all font-mono text-xs text-cyan-300">{selectedCall.agoraChannel || '--'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Created</p>
                <p className="mt-2 text-white">{formatDateTime(selectedCall.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Accepted</p>
                <p className="mt-2 text-white">{formatDateTime(selectedCall.acceptedAt)}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Ended</p>
                <p className="mt-2 text-white">{formatDateTime(selectedCall.endedAt)}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Rate / minute</p>
                <p className="mt-2 text-white">₹{selectedCall.ratePerMinute} / min</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Duration and spend</p>
              <p className="mt-2 text-white">
                {formatDuration(selectedCall.durationSeconds)} | {selectedCall.coinsSpent.toLocaleString('en-IN')} coins deducted
              </p>
            </div>
          </div>
        ) : null}
      </SideSheet>
    </div>
  )
}
