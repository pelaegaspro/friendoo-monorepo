import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHost, getHostEarnings } from '@/lib/admin/data'
import SectionCard from '@/components/admin/SectionCard'
import Badge from '@/components/ui/Badge'
import { ArrowLeft, Phone, IndianRupee, Sparkles, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HostDetailPage({
  params,
}: {
  params: Promise<{ hostId: string }>
}) {
  const resolvedParams = await Promise.resolve(params)
  const hostId = resolvedParams.hostId
  const [host, earnings] = await Promise.all([
    getHost(hostId),
    getHostEarnings(hostId),
  ])

  if (!host) {
    notFound()
  }

  const isSuspended = host.hostStatus === 'suspended'

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/hosts"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{host.name}</h1>
              <Badge variant={isSuspended ? 'danger' : 'success'}>
                {isSuspended ? 'Suspended' : 'Active Host'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 font-mono">ID: {host.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/hosts/${host.id}/earnings`}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>View Earnings & Payouts</span>
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Audio Rate</span>
            <IndianRupee className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">₹{host.ratePerMinute}/min</div>
          <div className="mt-1 text-[11px] text-zinc-500">Per minute voice charge</div>
        </div>

        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Completed Calls</span>
            <Phone className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{host.callsMade}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Total sessions answered</div>
        </div>

        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Available Balance</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{earnings?.availableForWithdrawal ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Ready for withdrawal</div>
        </div>

        <div className="bento-card p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Lifetime Earned</span>
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ₹{earnings?.lifetimeEarnings ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Gross revenue generated</div>
        </div>
      </div>

      {/* Host Profile Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Host Profile & Biography" description="Public host information presented to users.">
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-zinc-400">Bio / About:</span>
                <p className="mt-1 text-zinc-200 bg-white/5 p-3 rounded-xl border border-white/5">
                  {host.bio || 'No biography entered yet.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-400">Registered Phone:</span>
                  <p className="mt-0.5 text-white font-mono">{host.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-400">Onboarding Date:</span>
                  <p className="mt-0.5 text-white">{host.createdAt ? new Date(host.createdAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Quick Status" description="Account integrity & availability.">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                <span className="text-zinc-400">Account Standing</span>
                <span className={isSuspended ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {isSuspended ? 'Banned / Suspended' : 'Good Standing'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                <span className="text-zinc-400">Pending Payout</span>
                <span className="text-white font-bold">₹{earnings?.pendingWithdrawal ?? 0}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
