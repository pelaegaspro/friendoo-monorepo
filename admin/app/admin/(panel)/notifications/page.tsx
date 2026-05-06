'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import { adminFetch } from '@/lib/admin/client'
import { formatDateTime } from '@/lib/admin/format'
import { Bell, Send } from 'lucide-react'

type NotifLog = {
  id: string
  title: string
  body: string
  target: string
  sentAt: string | null
  sentBy: string
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'all' | 'topic' | 'user'>('all')
  const [userId, setUserId] = useState('')
  const [topic, setTopic] = useState('')
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await adminFetch<{ logs: NotifLog[] }>('/api/admin/notifications')
      setLogs(res.logs)
    } catch {
      // silent — logs are optional
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => { void loadLogs() }, [])

  const handleSend = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!body.trim()) { toast.error('Message body is required'); return }
    if (target === 'user' && !userId.trim()) { toast.error('User ID is required'); return }
    if (target === 'topic' && !topic.trim()) { toast.error('Topic name is required'); return }

    setSending(true)
    try {
      await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), body: body.trim(), target, userId: userId.trim(), topic: topic.trim() }),
      })
      toast.success('Notification sent successfully!')
      setTitle('')
      setBody('')
      setUserId('')
      setTopic('')
      await loadLogs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Send Form */}
      <SectionCard
        title="Send Push Notification"
        description="Broadcast a notification to all users, a specific topic, or an individual user."
      >
        <div className="space-y-4 max-w-xl">
          {/* Target selector */}
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Send To</label>
            <div className="flex gap-2">
              {(['all', 'topic', 'user'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    target === t
                      ? 'bg-purple-500 text-white'
                      : 'border border-[#343434] bg-[#111111] text-zinc-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All Users' : t === 'topic' ? 'Topic' : 'Specific User'}
                </button>
              ))}
            </div>
          </div>

          {target === 'topic' && (
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Topic Name</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. premium_users"
                className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          {target === 'user' && (
            <div>
              <label className="mb-1 block text-sm text-zinc-400">User ID (Firebase UID)</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. abc123uid..."
                className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-white outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎉 Special Offer!"
              className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Message Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your notification message..."
              rows={3}
              className="w-full rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-white outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
          >
            <Send size={14} />
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </SectionCard>

      {/* Notification History */}
      <SectionCard title="Notification History" description="Log of sent push notifications">
        {logsLoading ? (
          <div className="py-8 text-center text-sm text-zinc-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">No notifications sent yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between rounded-xl border border-[#242424] bg-[#161616] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-purple-500/15 p-1.5 text-purple-300">
                    <Bell size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{log.title}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">{log.body}</p>
                    <span className="mt-1 inline-block rounded-full border border-[#333] bg-[#111] px-2 py-0.5 text-xs text-zinc-500">
                      → {log.target}
                    </span>
                  </div>
                </div>
                <p className="ml-4 shrink-0 text-xs text-zinc-600">{log.sentAt ? formatDateTime(log.sentAt) : '—'}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
