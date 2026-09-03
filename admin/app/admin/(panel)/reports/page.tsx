'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import LoadingBlock from '@/components/admin/LoadingBlock'
import { Search, Paperclip } from 'lucide-react'

type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'rejected'
type ReportFilter = 'all' | ReportStatus

interface AdminReport {
  id: string
  reportedAlias?: string
  reportedId?: string
  reason?: string
  status: ReportStatus
  createdAt?: string | null
  evidenceUrl?: string | null
  amountLost: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asReportStatus(value: unknown): ReportStatus {
  return value === 'pending' || value === 'under_review' || value === 'resolved' || value === 'rejected'
    ? value
    : 'pending'
}

function normalizeReports(payload: unknown): AdminReport[] {
  const root = asRecord(payload)
  const values = Array.isArray(root.reports) ? root.reports : []
  return values.map((value) => {
    const report = asRecord(value)
    return {
      id: asString(report.id) ?? '',
      reportedAlias: asString(report.reportedAlias),
      reportedId: asString(report.reportedId),
      reason: asString(report.reason),
      status: asReportStatus(report.status),
      createdAt: asString(report.createdAt) ?? null,
      evidenceUrl: asString(report.evidenceUrl) ?? null,
      amountLost: asNumber(report.amountLost),
    }
  }).filter((report) => report.id.length > 0)
}



export default function ReportsPage() {
    const [reports, setReports] = useState<AdminReport[]>([])

  const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<ReportFilter>('all')

  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      try {
        const suffix = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
        const response = await fetch(`/api/admin/reports${suffix}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Could not load reports.');
                const payload: unknown = await response.json();
        if (active) setReports(normalizeReports(payload));

      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) setReports([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReports();
    return () => {
      active = false;
      controller.abort();
    };
  }, [filter])

  const filtered = useMemo(() => {
    return reports.filter(r => 
      search === "" || 
      r.reportedAlias?.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedId?.includes(search) ||
      r.reason?.toLowerCase().includes(search.toLowerCase())
    )
  }, [reports, search])

  const counts = useMemo(() => {
    return reports.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [reports])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trust & Safety Reports</h1>
          <p className="text-sm text-zinc-400">Monitor and resolve fraud, harassment, and PII violations.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Search Host, User, or Type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 rounded-xl border border-[#343434] bg-[#111111] py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
                {([
          { key: "all", label: "All Reports", count: reports.length },

          { key: "pending", label: "⏳ Pending", count: counts.pending || 0 },
          { key: "under_review", label: "🔍 Reviewing", count: counts.under_review || 0 },
          { key: "resolved", label: "✅ Resolved", count: counts.resolved || 0 },
          { key: "rejected", label: "❌ Closed", count: counts.rejected || 0 }
                ] as const).map(tab => (

          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === tab.key 
                ? 'bg-purple-600 text-white' 
                : 'border border-[#343434] bg-[#111111] text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock rows={8} />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#343434] py-20 text-center">
          <p className="text-zinc-500">No reports matching your criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#2d2d2d] bg-[#151515] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Report Type</th>
                <th className="px-6 py-4">Host</th>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {filtered.map((report) => (
                <tr 
                  key={report.id} 
                  onClick={() => router.push(`/admin/reports/${report.id}`)}
                  className="group cursor-pointer hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <PriorityDot priority={calculatePriority(report)} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white capitalize">
                      {report.reason?.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-300">{report.reportedAlias || 'Host'}</p>
                    <p className="font-mono text-[9px] text-zinc-500">{report.reportedId}</p>
                  </td>
                  <td className="px-6 py-4">
                    {report.evidenceUrl ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400">
                        <Paperclip size={10} /> SCREENSHOT
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-lg bg-purple-500/10 px-4 py-2 text-[11px] font-bold text-purple-400 transition group-hover:bg-purple-500 group-hover:text-white">
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-zinc-500'
  }
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${colors[priority] || colors.low}`} />
      <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">{priority}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    under_review: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    resolved: 'border-green-500/30 bg-green-500/10 text-green-400',
    rejected: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-500'
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${styles[status] || styles.rejected}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

function calculatePriority(report: AdminReport) {

    if (report.amountLost > 1000 || report.reason === "Threats of Violence") return "critical"
    if (report.evidenceUrl) return "high"
    if (report.status === "pending") return "medium"
    return "low"
}
