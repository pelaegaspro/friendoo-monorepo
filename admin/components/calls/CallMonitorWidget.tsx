'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, PhoneOff } from 'lucide-react'
import AgoraRTC, { IAgoraRTCClient, IRemoteAudioTrack } from 'agora-rtc-sdk-ng'
import { Call } from '@/types'
import { formatDuration } from '@/lib/utils/formatters'

interface Props {
  call: Call | null
  onLeave: () => void
}

export default function CallMonitorWidget({ call, onLeave }: Props) {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const audioTracksRef = useRef<Map<number, IRemoteAudioTrack>>(new Map())

  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [duration, setDuration] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Duration ticker
  useEffect(() => {
    if (!call) return
    const base = call.startedAt.toDate().getTime()
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - base) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [call])

  // Agora join/leave
  useEffect(() => {
    if (!call) return

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? ''
    let mounted = true

    const join = async () => {
      setIsConnecting(true)
      setError(null)
      try {
        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        clientRef.current = client
        await client.setClientRole('audience')

        client.on('user-published', async (user, mediaType) => {
          if (mediaType === 'audio') {
            await client.subscribe(user, 'audio')
            if (user.audioTrack) {
              audioTracksRef.current.set(user.uid as number, user.audioTrack)
              user.audioTrack.setVolume(speakerMuted ? 0 : volume)
              user.audioTrack.play()
            }
          }
        })

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'audio') {
            audioTracksRef.current.delete(user.uid as number)
          }
        })

        await client.join(appId, call.channelId, call.agoraToken ?? null, null)
        if (mounted) setIsConnecting(false)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to join call')
          setIsConnecting(false)
        }
      }
    }

    join()

    return () => {
      mounted = false
      clientRef.current?.leave().catch(() => {})
      clientRef.current = null
      audioTracksRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.id])

  // Sync volume/mute to tracks
  useEffect(() => {
    audioTracksRef.current.forEach((track) => {
      track.setVolume(speakerMuted ? 0 : volume)
    })
  }, [speakerMuted, volume])

  const handleLeave = async () => {
    await clientRef.current?.leave().catch(() => {})
    clientRef.current = null
    audioTracksRef.current.clear()
    onLeave()
  }

  if (!call) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Monitoring
        </span>
        <span className="text-xs font-mono text-gray-400">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Channel */}
      <p className="text-xs text-gray-400 mb-1">Channel</p>
      <p className="text-xs font-mono text-gray-200 truncate mb-3">{call.channelId}</p>

      {/* Participants */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-400">User</p>
          <p className="text-white font-medium truncate">{call.userName}</p>
        </div>
        <div>
          <p className="text-gray-400">Host</p>
          <p className="text-white font-medium truncate">{call.hostName}</p>
        </div>
      </div>

      {/* Status */}
      {isConnecting && (
        <p className="text-xs text-yellow-400 mb-3">Connecting…</p>
      )}
      {error && (
        <p className="text-xs text-red-400 mb-3">Error: {error}</p>
      )}

      {/* Volume controls */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setSpeakerMuted((m) => !m)}
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          title={speakerMuted ? 'Unmute' : 'Mute'}
        >
          {speakerMuted ? (
            <VolumeX size={16} className="text-gray-400" />
          ) : (
            <Volume2 size={16} className="text-green-400" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => {
            setVolume(Number(e.target.value))
            if (speakerMuted) setSpeakerMuted(false)
          }}
          className="flex-1 accent-green-500"
        />
        <span className="text-xs text-gray-400 w-7 text-right">{volume}</span>
      </div>

      {/* Leave */}
      <button
        onClick={handleLeave}
        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
      >
        <PhoneOff size={14} />
        Leave Call
      </button>
    </div>
  )
}
