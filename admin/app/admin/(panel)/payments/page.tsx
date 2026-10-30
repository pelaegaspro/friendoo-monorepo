'use client'

import Image from 'next/image'
import { useEffect, useState, useMemo } from 'react'

import toast from 'react-hot-toast'
import { getAppAvatarUrl } from '@/lib/avatar'
import { adminFetch } from '@/lib/admin/client'
import type { AdminHost } from '@/lib/admin/types'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import Badge from '@/components/ui/Badge'
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react'



type PayoutModalState = {
  host: PayoutRecord
  submitting: boolean
}

type PayoutRecord = {
  id: string
  hostId: string
  hostName: string
  photoURL: string
  phoneNumber: string
  callsMade: number
  coinsEarned: number
  earningsInr: number
  payoutStatus: 'pending' | 'paid'
  upiId: string
  requestedAt: string
  lastPaidAt?: string | null
}

type PendingPayout = {
  id: string
  hostId: string
  amount: number
  upiId: string
  status: string
  requestedAt: string
}

export default function PaymentsPage() {
  const [hosts, setHosts] = useState<AdminHost[]>([])
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<PayoutModalState | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [resHosts, resPayouts] = await Promise.all([
        adminFetch<{ hosts: AdminHost[] }>('/api/admin/hosts/list'),
        adminFetch<{ pendingPayouts: PendingPayout[] }>('/api/admin/payouts/pending')
      ])
      setHosts(resHosts.hosts)
      setPendingPayouts(resPayouts.pendingPayouts || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void Promise.resolve().then(() => load()) }, [])

  const payouts: PayoutRecord[] = useMemo(() => {
    return pendingPayouts.map(p => {
      const host = hosts.find(h => h.id === p.hostId)
      return {
        id: p.id,
        hostId: p.hostId,
        hostName: host?.displayName || 'Unknown',
        photoURL: host?.photoURL || '',
        phoneNumber: host?.phoneNumber || '',
        callsMade: host?.callsMade || 0,
        coinsEarned: host?.coinsEarned || 0,
        earningsInr: p.amount,
        payoutStatus: p.status as 'pending',
        upiId: p.upiId,
        requestedAt: p.requestedAt
      }
    }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
  }, [hosts, pendingPayouts])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return payouts
    return payouts.filter(
      (p) => p.hostName.toLowerCase().includes(q) || p.phoneNumber.includes(q) || p.upiId.toLowerCase().includes(q)
    )
  }, [payouts, search])

  const totalUnpaid = payouts.reduce((s, p) => s + p.earningsInr, 0)
  const totalHosts = new Set(payouts.map(p => p.hostId)).size

  const submitPayout = async () => {
    if (!modal) return
    setModal((prev) => prev ? { ...prev, submitting: true } : null)
    try {
      await adminFetch('/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify({
          hostId: modal.host.hostId,
          utr: 'AUTO_PROCESSED',
          amountInr: modal.host.earningsInr,
        }),
      })
      
      toast.success(`Payout of ₹${modal.host.earningsInr} processed for ${modal.host.hostName}`)
      setModal(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process payout')
      setModal((prev) => prev ? { ...prev, submitting: false } : null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={<Users size={18} />} label="Active Hosts" value={String(totalHosts)} color="purple" />
        <KpiCard icon={<DollarSign size={18} />} label="Total Unpaid (₹)" value={`₹${totalUnpaid.toLocaleString('en-IN')}`} color="yellow" />
        <KpiCard icon={<TrendingUp size={18} />} label="Total Calls" value={payouts.reduce((s, p) => s + p.callsMade, 0).toLocaleString('en-IN')} color="blue" />
        <KpiCard icon={<CreditCard size={18} />} label="Rate" value="1 Coin = ₹1" color="green" />
      </div>

      <SectionCard
        title="Host Earnings & Payouts"
        description="View and record salary payouts for all active hosts. 1 Coin = ₹1 INR."
      >
        {/* Search */}
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 md:w-72"
          />
        </div>

        {loading ? (
          <LoadingBlock rows={5} />
        ) : filtered.length === 0 ? (
          <DataState title="No earnings data" body="Hosts with completed calls will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2b2b2b] text-zinc-400">
                  <th className="px-3 py-3 font-medium">Host</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Calls</th>
                  <th className="px-3 py-3 font-medium">Coins Earned</th>
                  <th className="px-3 py-3 font-medium">Earnings (₹)</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.hostId} className="border-b border-[#202020] align-middle hover:bg-white/[0.02]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {getAppAvatarUrl(p.photoURL) ? (
                          <Image
                            src={getAppAvatarUrl(p.photoURL)!}
                            alt={p.hostName}
                            width={36}
                            height={36}
                            unoptimized
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-950/50 text-xs font-bold text-purple-300 border border-purple-500/30">
                            {(p.hostName || 'H').slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <span className="font-medium text-white">{p.hostName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{p.phoneNumber || '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{p.callsMade.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-zinc-300">{p.coinsEarned.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 font-semibold text-green-400">₹{p.earningsInr.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3">
                      <Badge label={p.payoutStatus} variant={p.payoutStatus === 'paid' ? 'approved' : 'pending'} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setModal({ host: p, submitting: false })}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20"
                      >
                        Record Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Payout Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#2d2d2d] bg-[#131313] p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-white">Record Payout</h2>
            <p className="mb-5 text-sm text-zinc-500">
              Marking salary payment for <span className="text-purple-300">{modal.host.hostName}</span>
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-sm text-purple-200">
                  You are about to initiate an automated Cashfree Payout for <strong className="text-white">₹{modal.host.earningsInr}</strong>. 
                  The funds will be transferred to their registered UPI ID: <strong className="text-white">{modal.host.upiId}</strong>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-[#343434] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modal.submitting}
                onClick={submitPayout}
                className="flex-1 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
              >
                {modal.submitting ? 'Saving...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500/15 text-purple-300',
    yellow: 'bg-yellow-500/15 text-yellow-300',
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-green-500/15 text-green-300',
  }
  return (
    <div className="rounded-2xl border border-[#2d2d2d] bg-[#111111] p-4">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${colorMap[color] ?? colorMap.purple}`}>
        {icon}
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  )
}
