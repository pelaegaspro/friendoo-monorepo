'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Send, ChevronDown } from 'lucide-react'

interface Template {
  name: string
  subject: string
  html: string
}

const TEMPLATES: Template[] = [
  {
    name: 'Welcome',
    subject: 'Welcome to Friendoo!',
    html: '<h2>Welcome to Friendoo!</h2><p>We\'re excited to have you on board. Start exploring and connecting with amazing hosts today.</p>',
  },
  {
    name: 'Warning',
    subject: 'Important Notice Regarding Your Account',
    html: '<h2>Account Warning</h2><p>We have noticed activity on your account that violates our community guidelines. Please review our terms of service. Further violations may result in account suspension.</p>',
  },
  {
    name: 'Account Suspended',
    subject: 'Your Friendoo Account Has Been Suspended',
    html: '<h2>Account Suspended</h2><p>Your account has been suspended due to violations of our community guidelines. If you believe this is a mistake, please contact our support team.</p>',
  },
  {
    name: 'Host Approved',
    subject: 'Congratulations! Your Host Application is Approved',
    html: '<h2>Host Application Approved!</h2><p>Great news! Your application to become a Friendoo host has been approved. You can now start accepting bookings.</p>',
  },
  {
    name: 'Host Rejected',
    subject: 'Update on Your Friendoo Host Application',
    html: '<h2>Host Application Update</h2><p>Thank you for applying to become a Friendoo host. Unfortunately, we are unable to approve your application at this time. <strong>Reason:</strong> [REASON]</p>',
  },
  {
    name: 'Promotion/Announcement',
    subject: 'Exciting News from Friendoo!',
    html: '<h2>Exciting Announcement!</h2><p>We have some exciting news to share with you. Stay tuned for more updates!</p>',
  },
]

interface EmailComposerProps {
  onSent?: () => void
}

export default function EmailComposer({ onSent }: EmailComposerProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const applyTemplate = (templateName: string) => {
    const t = TEMPLATES.find((t) => t.name === templateName)
    if (t) {
      setSubject(t.subject)
      setBody(t.html)
      setSelectedTemplate(templateName)
    }
  }

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to === 'all' ? 'all' : to,
          subject,
          html: body,
          template: selectedTemplate || 'custom',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Email sent successfully')
        setTo('')
        setSubject('')
        setBody('')
        setSelectedTemplate('')
        onSent?.()
      } else {
        toast.error(data.error ?? 'Failed to send email')
      }
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-lg">Compose Email</h3>

      {/* Template selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Template (optional)</label>
        <div className="relative">
          <select
            value={selectedTemplate}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full appearance-none bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 pr-8 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a template...</option>
            {TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* To field */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">To</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder='Email address or type "all" for all users'
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">Type "all" to send to all users</p>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Body (HTML supported)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Email body... (HTML is supported)"
          rows={8}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y font-mono"
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending}
        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
      >
        <Send size={16} />
        {sending ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  )
}
