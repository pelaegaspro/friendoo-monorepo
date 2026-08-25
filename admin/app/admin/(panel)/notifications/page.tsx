'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import { adminFetch } from '@/lib/admin/client'
import { formatDateTime } from '@/lib/admin/format'
import { Bell, Send, Zap, Flame, Gift, Megaphone, Smartphone } from 'lucide-react'

type NotifLog = {
  id: string
  title: string
  body: string
  target: string
  actionType: string
  sentAt: string | null
  sentBy: string
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'all' | 'users' | 'hosts' | 'user'>('all')
  const [actionType, setActionType] = useState<'recharge' | 'open_lounge' | 'link' | 'none'>('none')
  const [actionUrl, setActionUrl] = useState('')
  const [userId, setUserId] = useState('')
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await adminFetch<{ logs: NotifLog[] }>('/api/admin/notifications')
      setLogs(res.logs)
    } catch {
      // silent
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!body.trim()) {
      toast.error('Message body is required')
      return
    }
    if (target === 'user' && !userId.trim()) {
      toast.error('User ID is required')
      return
    }

    setSending(true)
    try {
      await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
          userId: userId.trim(),
          actionType,
          actionUrl: actionUrl.trim(),
        }),
      })
      toast.success('Push notification broadcasted in real-time!')
      setTitle('')
      setBody('')
      setUserId('')
      setActionUrl('')
      await loadLogs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  // Quick Preset Handlers
  const applyFlashOfferPreset = () => {
    setTitle('⚡ FLASH DEAL: 50 Coins for ₹39!')
    setBody('Special introductory offer unlocked! Recharge now to get 50 talk coins at 20% discount.')
    setTarget('users')
    setActionType('recharge')
  }

  const applyHostSurgePreset = () => {
    setTitle('🔥 Peak Hour Surge: +₹10/Min Active!')
    setBody('High caller demand right now. Go online in your Voice Lounge to maximize earnings tonight.')
    setTarget('hosts')
    setActionType('open_lounge')
  }

  const applyWelcomeGiftPreset = () => {
    setTitle('🎁 Welcome Bonus Coins Added!')
    setBody('Start talking to friendly verified hosts in Tamil, Telugu, Hindi, or English.')
    setTarget('all')
    setActionType('none')
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="bento-badge border-purple-500/30 bg-purple-500/10 text-purple-300">
            Realtime Push Engine
          </span>
          <span className="bento-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            Android 13+ Enabled
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Push Campaigns & Heads-Up Alerts
        </h1>
        <p className="text-sm text-zinc-400">
          Broadcast real-time push notifications, flash discount alerts, and host surge calls to connected mobile devices.
        </p>
      </div>

      {/* Send Form */}
      <SectionCard
        title="Broadcast Push Notification"
        description="Deliver heads-up alerts directly to users' phones with custom tap actions."
      >
        {/* Quick Presets */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400">1-Click Presets:</span>
          <button
            type="button"
            onClick={applyFlashOfferPreset}
            className="inline-flex items-center gap-1 rounded-lg bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/30"
          >
            <Zap className="h-3 w-3" /> 50 Coins for ₹39 Deal
          </button>
          <button
            type="button"
            onClick={applyHostSurgePreset}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30"
          >
            <Flame className="h-3 w-3" /> Host Surge +₹10/Min
          </button>
          <button
            type="button"
            onClick={applyWelcomeGiftPreset}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-500/30"
          >
            <Gift className="h-3 w-3" /> Welcome Gift
          </button>
        </div>

        <div className="space-y-4 max-w-xl">
          {/* Target selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">Send To (Audience)</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: 'All Users & Hosts' },
                { id: 'users', label: 'Callers Only' },
                { id: 'hosts', label: 'Hosts Only' },
                { id: 'user', label: 'Specific User ID' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTarget(t.id as any)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    target === t.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {target === 'user' && (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Target User ID (UUID)</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Notification Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ⚡ Flash Deal: 50 Coins for ₹39!"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Notification Message Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter message text that will display on the user's phone..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Tap Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="none">Dismiss Only</option>
                <option value="recharge">Open Coin Recharge Sheet</option>
                <option value="open_lounge">Open Voice Lounge</option>
                <option value="link">Open External Link</option>
              </select>
            </div>

            {actionType === 'link' && (
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Action URL</label>
                <input
                  type="url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Live Phone Heads-Up Preview */}
          <div className="pt-2">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Phone Heads-Up Notification Preview</div>
            <div className="rounded-2xl border border-purple-500/30 bg-[#13141F] p-3.5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{title || 'Notification Title'}</span>
                    <span className="text-[10px] text-zinc-500">now</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-300 line-clamp-2">{body || 'Notification message description will appear here on user phones.'}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            <Send size={13} />
            {sending ? 'Broadcasting...' : 'Broadcast Push Notification'}
          </button>
        </div>
      </SectionCard>

      {/* Notification History */}
      <SectionCard title="Notification Broadcast Log" description="Recent notifications sent via push">
        {logsLoading ? (
          <div className="py-8 text-center text-sm text-zinc-500">Loading broadcast history...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">No push notifications sent yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/60 p-3.5"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{log.title}</span>
                    <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      {log.target}
                    </span>
                    {log.actionType !== 'none' && (
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {log.actionType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{log.body}</p>
                </div>
                <div className="text-right text-xs text-zinc-500 shrink-0">
                  {formatDateTime(log.sentAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
