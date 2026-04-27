'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, ChevronDown } from 'lucide-react'

interface NotificationComposerProps {
  onSent?: () => void
}

type Target = 'user' | 'all_users' | 'all_hosts'

export default function NotificationComposer({ onSent }: NotificationComposerProps) {
  const [target, setTarget] = useState<Target>('all_users')
  const [targetId, setTargetId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in title and body')
      return
    }
    if (target === 'user' && !targetId.trim()) {
      toast.error('Please enter a user ID')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, targetId: target === 'user' ? targetId : undefined, title, body }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Notification sent successfully')
        setTitle('')
        setBody('')
        setTargetId('')
        onSent?.()
      } else {
        toast.error(data.error ?? 'Failed to send notification')
      }
    } catch {
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-lg">Send Push Notification</h3>

      {/* Target */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Target</label>
        <div className="relative">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
            className="w-full appearance-none bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 pr-8 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all_users">All Users</option>
            <option value="all_hosts">All Hosts</option>
            <option value="user">Specific User</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* User ID (only when target = user) */}
      {target === 'user' && (
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">User ID (UID)</label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Firebase UID of the user..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notification message..."
          rows={4}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
      >
        <Bell size={16} />
        {sending ? 'Sending...' : 'Send Notification'}
      </button>
    </div>
  )
}
