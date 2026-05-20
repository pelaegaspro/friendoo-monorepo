import { useEffect, useRef, useState, useCallback } from 'react'
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng'
import { PhoneOff, Mic, MicOff } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { getAgoraToken, endCall } from '@/lib/callService'
import type { Host } from '@/types'
import toast from 'react-hot-toast'

interface CallModalProps {
  host: Host
  callId: string
  userId: number
  onClose: () => void
}

export function CallModal({ host, callId, userId, onClose }: CallModalProps) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(Date.now())

  const hangUp = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    const duration = Math.round((Date.now() - startedAt.current) / 1000)
    const coinsSpent = Math.ceil((duration / 60) * host.ratePerMinute)
    try {
      if (clientRef.current) {
        await clientRef.current.leave()
      }
      await endCall(callId, duration, coinsSpent)
    } catch (e) {
      console.error('hangUp error', e)
    }
    onClose()
  }, [callId, host.ratePerMinute, onClose])

  useEffect(() => {
    let cancelled = false

    async function join() {
      try {
        const credentials = await getAgoraToken(callId)
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client
        await client.join(credentials.appId, credentials.channel, credentials.token, userId)

        const track = await AgoraRTC.createMicrophoneAudioTrack()
        await client.publish(track)

        if (!cancelled) {
          setConnected(true)
          startedAt.current = Date.now()
          timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
        }
      } catch (err) {
        console.error('Agora join error', err)
        toast.error('Could not connect call')
        onClose()
      }
    }

    join()

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
      clientRef.current?.leave().catch(() => {})
    }
  }, [callId, userId, onClose])

  async function toggleMute() {
    const client = clientRef.current
    if (!client) return
    const tracks = client.localTracks
    for (const t of tracks) {
      if (t.trackMediaType === 'audio') {
        muted ? await (t as { setEnabled(v: boolean): Promise<void> }).setEnabled(true)
               : await (t as { setEnabled(v: boolean): Promise<void> }).setEnabled(false)
      }
    }
    setMuted((m) => !m)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060810]/97 backdrop-blur">
      <div className="flex flex-col items-center gap-4">
        {host.photoURL ? (
          <img
            src={host.photoURL}
            alt={host.displayName}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-[#7c5cff]/40"
            loading="lazy"
            width="112"
            height="112"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#ff7ab6] flex items-center justify-center text-3xl font-bold">
            {host.displayName[0]?.toUpperCase()}
          </div>
        )}

        <h2 className="text-xl font-bold">{host.displayName}</h2>
        <p className="text-white/50 text-sm">
          {connected ? formatDuration(seconds) : 'Connecting…'}
        </p>
        <p className="text-white/30 text-xs">
          ₹{host.ratePerMinute}/min · {Math.ceil((seconds / 60) * host.ratePerMinute)} coins spent
        </p>
      </div>

      <div className="flex gap-6 mt-12">
        <button
          onClick={toggleMute}
          className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center transition hover:bg-white/20"
        >
          {muted ? <MicOff size={22} className="text-red-400" /> : <Mic size={22} />}
        </button>
        <button
          onClick={hangUp}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center transition hover:bg-red-400"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  )
}
