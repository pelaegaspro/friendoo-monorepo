'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import LoadingBlock from '@/components/admin/LoadingBlock'
import {
  Search,
  Headphones,
  ShieldAlert,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/admin/client'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface AdminSupportTicket {
  id: string
  reporterId?: string
  reporterName: string
  reporterPhone: string
  reporterCity: string
  reporterRole: string
  coinBalance: number
  subject: string
  category: string
  priority: string
  status: TicketStatus
  scenario: string
  orderId?: string | null
  amountInr?: number | null
  coins?: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt?: string
}

interface AdminReport {
  id: string
  reporterName?: string
  reportedAlias?: string
  reportedId?: string
  reason?: string
  status: string
  createdAt?: string | null
  evidenceUrl?: string | null
  amountLost: number
}

export default function ReportsAndSupportPage() {
  const [activeTab, setActiveTab] = useState<'support' | 'abuse'>('support')
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Quick Coin Credit Modal state
  const [creditModalTicket, setCreditModalTicket] = useState<AdminSupportTicket | null>(null)
  const [creditCoinsAmount, setCreditCoinsAmount] = useState(100)
  const [crediting, setCrediting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await adminFetch<{ tickets: AdminSupportTicket[]; reports: AdminReport[] }>('/api/admin/reports')
      setTickets(res.tickets || [])
      setReports(res.reports || [])
    } catch {
      toast.error('Failed to load tickets and reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [])

  const filteredTickets = useMemo(() => {
    let list = tickets
    if (statusFilter === 'payment_failure') {
      list = list.filter((t) => t.scenario === 'payment_failure')
    } else if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter)
    }

    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (t) =>
        t.reporterName.toLowerCase().includes(q) ||
        t.reporterPhone.includes(q) ||
        t.reporterCity.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q))
    )
  }, [tickets, statusFilter, search])

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      (r) =>
        (r.reportedAlias || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q) ||
        (r.reportedId || '').includes(q)
    )
  }, [reports, search])

  const handleUpdateTicketStatus = async (ticketId: string, nextStatus: TicketStatus) => {
    try {
      await adminFetch('/api/admin/reports', {
        method: 'POST',
        body: JSON.stringify({ ticketId, status: nextStatus }),
      })
      toast.success(`Ticket marked as ${nextStatus}`)
      await loadData()
    } catch {
      toast.error('Failed to update ticket status')
    }
  }

  const handleQuickCreditCoins = async () => {
    if (!creditModalTicket || !creditModalTicket.reporterId) return
    setCrediting(true)
    try {
      await adminFetch('/api/admin/users/addCoins', {
        method: 'POST',
        body: JSON.stringify({
          userId: creditModalTicket.reporterId,
          amountCoins: creditCoinsAmount,
          idempotencyKey: `support_refund:${creditModalTicket.id}:${Date.now()}`,
        }),
      })

      // Auto-resolve ticket on successful refund
      await adminFetch('/api/admin/reports', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: creditModalTicket.id,
          status: 'resolved',
          internalNotes: `Credited ${creditCoinsAmount} coins to resolve ${creditModalTicket.scenario}`,
        }),
      })

      toast.success(`Credited ${creditCoinsAmount} coins & resolved ticket #${creditModalTicket.id.slice(0, 8)}`)
      setCreditModalTicket(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Coin credit failed')
    } finally {
      setCrediting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              24/7 Support Desk & Incident Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
              LIVE OPERATIONS
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-400">
            Real-time incident reports from app callers (payment failure, call drops, disputes) with 1-click coin refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              type="text"
              placeholder="Search phone, order ID, caller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-xl border border-white/[0.08] bg-[#121217] py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-zinc-300 hover:bg-white/[0.08]"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Mode Toggle: Support Tickets vs Abuse Reports */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'support'
                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                : 'border border-white/[0.06] bg-[#141419] text-zinc-400 hover:text-white'
            }`}
          >
            <Headphones size={14} />
            <span>24/7 Support Tickets</span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{tickets.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('abuse')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'abuse'
                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                : 'border border-white/[0.06] bg-[#141419] text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Call & Host Reports</span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{reports.length}</span>
          </button>
        </div>

        {activeTab === 'support' && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
            {[
              { key: 'all', label: 'All' },
              { key: 'payment_failure', label: '💳 Payment Issues' },
              { key: 'open', label: '⏳ Open' },
              { key: 'in_progress', label: '🔍 In Progress' },
              { key: 'resolved', label: '✅ Resolved' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-lg px-2.5 py-1 transition ${
                  statusFilter === f.key
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : activeTab === 'support' ? (
        filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-[#101015] py-20 text-center">
            <Headphones className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400">No support tickets in this queue</p>
            <p className="mt-1 text-xs text-zinc-600">
              When callers or hosts submit tickets from the mobile app, they appear here instantly.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111116] shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#16161d] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="px-4 py-3.5">Scenario / Priority</th>
                    <th className="px-4 py-3.5">Caller Details</th>
                    <th className="px-4 py-3.5">Issue Summary</th>
                    <th className="px-4 py-3.5">Telemetry / Order</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Submitted</th>
                    <th className="px-4 py-3.5 text-right">Direct Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredTickets.map((t) => {
                    const isPayment = t.scenario === 'payment_failure'
                    const isOpen = t.status === 'open'
                    const isResolved = t.status === 'resolved'

                    return (
                      <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                isPayment
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : t.scenario === 'call_drop_billing'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : t.scenario === 'host_misconduct'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {isPayment && '💳 '}
                              {t.scenario.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                              Priority: {t.priority}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-bold text-white text-xs">{t.reporterName}</p>
                            <p className="font-mono text-[10px] text-zinc-400">{t.reporterPhone}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                              <span>📍 {t.reporterCity || '—'}</span>
                              <span>•</span>
                              <span className="text-amber-400 font-bold font-mono">{t.coinBalance} 🪙</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="font-bold text-zinc-200 truncate">{t.subject}</p>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{t.category}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          {t.orderId ? (
                            <div className="font-mono text-[11px]">
                              <span className="font-bold text-red-300">Order: {t.orderId}</span>
                              {t.amountInr != null && (
                                <p className="text-emerald-400 font-semibold">₹{t.amountInr}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px]">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              isResolved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isOpen
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-500 text-[10.5px]">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 1-Click Credit Coins / Refund */}
                            {t.reporterId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCreditModalTicket(t)
                                  setCreditCoinsAmount(t.coins || (t.amountInr ? Math.round(t.amountInr) : 100))
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition"
                                title="Add coins directly to user wallet"
                              >
                                <Coins size={12} />
                                <span>Credit Coins</span>
                              </button>
                            )}

                            {/* Mark Resolved */}
                            {!isResolved ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                              >
                                Resolve
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(t.id, 'open')}
                                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Abuse Reports view */
        filteredReports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-[#101015] py-20 text-center">
            <p className="text-sm font-semibold text-zinc-400">No abuse reports found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111116] shadow-xl">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#16161d] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-3.5">Report Reason</th>
                  <th className="px-4 py-3.5">Reported Party</th>
                  <th className="px-4 py-3.5">Reporter</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 font-bold text-white capitalize">{r.reason?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3.5 font-bold text-purple-300">{r.reportedAlias}</td>
                    <td className="px-4 py-3.5 text-zinc-400">{r.reporterName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Quick Credit Coins Modal */}
      {creditModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#16161e] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Instant Coin Compensation</h3>
                  <p className="text-xs text-zinc-400">Credit caller wallet to resolve incident</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreditModalTicket(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Caller:</span>
                <span className="font-bold text-white">{creditModalTicket.reporterName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Phone:</span>
                <span className="font-mono text-zinc-300">{creditModalTicket.reporterPhone}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Current Balance:</span>
                <span className="font-mono font-bold text-amber-400">{creditModalTicket.coinBalance} 🪙</span>
              </div>
              {creditModalTicket.orderId && (
                <div className="flex justify-between text-zinc-400">
                  <span>Failed Order:</span>
                  <span className="font-mono text-red-300">{creditModalTicket.orderId}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Coins to Credit
              </label>
              <input
                type="number"
                min={1}
                value={creditCoinsAmount}
                onChange={(e) => setCreditCoinsAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm font-mono font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                {[15, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCreditCoinsAmount(amt)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:bg-white/10"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreditModalTicket(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreditCoins}
                disabled={crediting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                <Coins size={14} />
                <span>{crediting ? 'Crediting...' : `Credit ${creditCoinsAmount} Coins & Resolve`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
