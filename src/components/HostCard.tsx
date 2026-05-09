import { memo } from 'react'
import { Star, Phone, MessageCircle, Wifi } from 'lucide-react'
import { initials } from '@/lib/utils'
import type { Host } from '@/types'

interface HostCardProps {
  host: Host
  onCall: (host: Host) => void
  onChat: (host: Host) => void
}

const LANGUAGE_COLORS: Record<string, string> = {
  Hindi: 'bg-orange-500/15 text-orange-300',
  Tamil: 'bg-green-500/15 text-green-300',
  Telugu: 'bg-blue-500/15 text-blue-300',
  Kannada: 'bg-purple-500/15 text-purple-300',
  Malayalam: 'bg-teal-500/15 text-teal-300',
  Urdu: 'bg-pink-500/15 text-pink-300',
  English: 'bg-white/10 text-white/70',
}

export const HostCard = memo(function HostCard({ host, onCall, onChat }: HostCardProps) {
  const available = host.callStatus === 'available'
  const isStar = host.hostTier === 'star'

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
      <div className="relative">
        {host.photoURL ? (
          <img
            src={host.photoURL}
            alt={host.displayName}
            className="w-full h-44 object-cover"
            loading="lazy"
            width="100%"
            height="176"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-[#7c5cff]/30 to-[#ff7ab6]/20 flex items-center justify-center text-3xl font-bold text-white/60">
            {initials(host.displayName)}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {isStar && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-bold">
              ★ STAR
            </span>
          )}
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              available
                ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                : 'bg-white/10 border border-white/10 text-white/40'
            }`}
          >
            <Wifi size={9} />
            {available ? 'Online' : 'Busy'}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{host.displayName}</h3>
            <p className="text-white/40 text-xs mt-0.5">{host.city || 'India'}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold">{host.rating?.toFixed(1) ?? '—'}</span>
          </div>
        </div>

        {host.bio ? (
          <p className="text-white/50 text-xs mt-2 line-clamp-2">{host.bio}</p>
        ) : null}

        <div className="flex flex-wrap gap-1 mt-2">
          {(host.languages ?? []).slice(0, 3).map((lang) => (
            <span
              key={lang}
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${LANGUAGE_COLORS[lang] ?? 'bg-white/10 text-white/60'}`}
            >
              {lang}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-white/40">
            ₹{host.ratePerMinute ?? 5}
            <span className="text-white/25">/min</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onChat(host)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold transition hover:bg-white/10"
            >
              <MessageCircle size={13} />
              Chat
            </button>
            <button
              onClick={() => onCall(host)}
              disabled={!available}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                available
                  ? 'bg-[#7c5cff] hover:bg-[#9375ff] text-white'
                  : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/[0.06]'
              }`}
            >
              <Phone size={13} />
              Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
