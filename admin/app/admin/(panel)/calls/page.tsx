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

export default function CallsAdminPage() {
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | CallStatus>('all')
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ calls: CallRow[] }>('/api/admin/calls/list')
      setCalls(response.calls)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load calls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredCalls = useMemo(
    () => calls.filter((call) => (statusFilter === 'all' ? true : call.status === statusFilter)),
    [calls, statusFilter]
  )

  return (
    <div className="space-y-6">
      <SectionCard title="Call History" description="Monitor active, ended, and missed calls across the platform.">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'ended', 'missed'] as const).map((status) => (
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
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <SectionCard>
          {filteredCalls.length === 0 ? (
            <DataState title="No calls found" body="Try a different status filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">Caller</th>
                    <th className="px-3 py-3 font-medium">Host</th>
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
                      <td className="px-3 py-4 font-medium text-white">{call.callerName}</td>
                      <td className="px-3 py-4 text-zinc-300">{call.hostName}</td>
                      <td className="px-3 py-4 text-zinc-300">{formatDuration(call.durationSeconds)}</td>
                      <td className="px-3 py-4 text-zinc-300">{call.coinsSpent.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4">
                        <Badge label={call.status} variant={call.status === 'active' ? 'active' : call.status === 'ended' ? 'completed' : 'default'} />
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
        title="Call Details"
        description="Full metadata for the selected call."
        widthClassName="max-w-lg"
      >
        {selectedCall ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Caller</p>
                <p className="mt-2 text-white">{selectedCall.callerName}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Host</p>
                <p className="mt-2 text-white">{selectedCall.hostName}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
                <p className="mt-2 text-white">{selectedCall.status}</p>
              </div>
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Agora Channel</p>
                <p className="mt-2 break-all text-white">{selectedCall.agoraChannel || '--'}</p>
              </div>
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
                <p className="mt-2 text-white">{selectedCall.ratePerMinute}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#2d2d2d] bg-[#141414] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Duration and spend</p>
              <p className="mt-2 text-white">
                {formatDuration(selectedCall.durationSeconds)} | {selectedCall.coinsSpent.toLocaleString('en-IN')} coins
              </p>
            </div>
          </div>
        ) : null}
      </SideSheet>
    </div>
  )
}
