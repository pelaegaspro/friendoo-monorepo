'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/admin/client'
import { Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAdmin = () => {
    router.replace('/admin')
  }

  const handleCrm = async () => {
    setLoading('crm')
    try {
      await adminFetch('/api/admin/auth/set-crm-session', { method: 'POST' })
      const crmUrl = window.location.port === '3001'
        ? `${window.location.protocol}//${window.location.hostname}:3000/crm`
        : '/crm'
      window.location.href = crmUrl
    } catch {
      toast.error('Failed to set CRM session')
    } finally {
      setLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/admin/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="mx-auto w-fit mb-4 select-none">
            <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#ff7ab6" />
                </linearGradient>
              </defs>
              <text x="0" y="22" fill="url(#logoGrad)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-white">Welcome</h1>
          <p className="mt-2 text-sm text-zinc-400">Select a dashboard to continue.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Admin Panel */}
          <button
            onClick={handleAdmin}
            className="group rounded-3xl border border-[#2b2b2b] bg-[#161616] p-6 text-left transition hover:border-purple-500/50 hover:bg-[#1a1a1a]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Manage users, hosts, packages, payments, and app settings.
            </p>
          </button>

          {/* CRM Dashboard */}
          <button
            onClick={handleCrm}
            disabled={loading === 'crm'}
            className="group rounded-3xl border border-[#2b2b2b] bg-[#161616] p-6 text-left transition hover:border-emerald-500/50 hover:bg-[#1a1a1a] disabled:opacity-60"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">CRM Dashboard</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Users, hosts, revenue, support tickets, campaigns, and fraud monitoring.
            </p>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
