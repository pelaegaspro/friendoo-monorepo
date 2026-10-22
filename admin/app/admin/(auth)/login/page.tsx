'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LockKeyhole } from 'lucide-react'
import { adminFetch } from '@/lib/admin/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await adminFetch('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      toast.success('Access granted')
      window.location.href = '/admin'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bento-card p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto w-fit mb-4 select-none">
            <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
              <defs>
                <linearGradient id="logoGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <text x="0" y="22" fill="url(#logoGradLogin)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">Admin Operations Bento</h1>
          <p className="mt-2 text-xs text-muted-foreground">Authenticate to access live governance matrix.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-muted-foreground">Admin Password</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter password"
                className="w-full rounded-2xl border border-border bg-surface pl-11 pr-4 py-3 text-foreground text-sm outline-none transition placeholder:text-muted-foreground focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
              <LockKeyhole className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </label>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Dev Password: <strong className="text-purple-400 font-mono">friendoo-admin</strong></span>
            <button
              type="button"
              onClick={() => setPassword("friendoo-admin")}
              className="text-purple-400 hover:underline hover:text-purple-300 font-medium"
            >
              Autofill
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-purple-900/30"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Matrix'}
          </button>
        </form>
      </div>
    </div>
  )
}
