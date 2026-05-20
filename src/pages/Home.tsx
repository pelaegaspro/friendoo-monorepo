import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { Layout } from '@/components/Layout'
import { HostCard } from '@/components/HostCard'
import { useHostFeed } from '@/hooks/useHostFeed'
import { useAuthContext } from '@/contexts/AuthContext'
import { requestCall } from '@/lib/callService'
import type { Host } from '@/types'
import toast from 'react-hot-toast'

// Lazy load heavy components
const CallModal = lazy(() => import('@/components/CallModal').then(m => ({ default: m.CallModal })))

interface ActiveCall {
  host: Host
  callId: string
  channel: string
  userId: number
}

export function Home() {
  const { user, profile } = useAuthContext()
  const [langFilter, setLangFilter] = useState<string | undefined>(undefined)
  const { hosts, loading } = useHostFeed(langFilter)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)

  const languages = useMemo(() => ['All', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Urdu', 'English'], [])

  const handleCall = useCallback(async (host: Host) => {
    if (!user || !profile) return
    const minBalance = 30
    if (profile.coinBalance < minBalance) {
      toast.error(`You need at least ${minBalance} coins to start a call`)
      return
    }
    try {
      const { callId, channel } = await requestCall(user.uid, host.id)
      setActiveCall({
        host,
        callId,
        channel,
        userId: Math.floor(Math.random() * 100000),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start call'
      toast.error(msg)
    }
  }, [user, profile])

  return (
    <>
      <Layout title="Friendoo">
        <div className="px-4 py-3 sticky top-14 z-30 bg-[#060810]/95 backdrop-blur border-b border-white/[0.05]">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang === 'All' ? undefined : lang)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  (lang === 'All' && !langFilter) || langFilter === lang
                    ? 'bg-[#7c5cff] border-[#7c5cff] text-white'
                    : 'bg-transparent border-white/[0.12] text-white/50 hover:text-white/80'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.04] h-56 animate-pulse" />
              ))}
            </div>
          ) : hosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-white/70">No hosts online</p>
              <p className="text-white/30 text-sm mt-1">
                {langFilter ? `No ${langFilter} hosts available right now.` : 'Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {hosts.map((host) => (
                <HostCard
                  key={host.id}
                  host={host}
                  onCall={handleCall}
                />
              ))}
            </div>
          )}
        </div>
      </Layout>

      {activeCall && (
        <Suspense fallback={null}>
          <CallModal
            host={activeCall.host}
            callId={activeCall.callId}
            userId={activeCall.userId}
            onClose={() => setActiveCall(null)}
          />
        </Suspense>
      )}
    </>
  )
}
