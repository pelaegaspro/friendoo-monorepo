import Link from 'next/link'
import { ExternalLink, ArrowLeft, Users, Sparkles, Megaphone, Ticket } from 'lucide-react'

export default function CrmPortalRedirectPage() {
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || 'https://friendoo-crm.netlify.app'

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-purple-500/30 bg-[#12121b]/95 p-8 text-center shadow-2xl backdrop-blur-xl space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Users className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Friendoo CRM Platform</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Customer Relationship Management operates on a dedicated service for customer support, marketing journeys, and churn analytics.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left text-xs">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <Megaphone className="h-3.5 w-3.5" /> Push Campaigns
            </span>
            <p className="text-[11px] text-zinc-500">Targeted marketing blasts</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Ticket className="h-3.5 w-3.5" /> Support Tickets
            </span>
            <p className="text-[11px] text-zinc-500">Client dispute resolution</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <a
            href={crmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
          >
            <span>Open Dedicated CRM Service</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Admin Overview</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
