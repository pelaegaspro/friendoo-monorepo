'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LockKeyhole, Sparkles, ArrowRight } from 'lucide-react'
import { adminFetch } from '@/lib/admin/client'

const isSignInPaused = process.env.NEXT_PUBLIC_PAUSE_SIGN_IN !== 'false'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If sign-in is paused for testing, automatically proceed to dashboard
    if (isSignInPaused) {
      router.replace('/admin')
    }
  }, [router])

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
    <div className="flex min-h-screen items-center justify-center bg-[#040D12] px-4 font-sans selection:bg-[#60CECA]/30 selection:text-[#60CECA]">
      <div className="w-full max-w-md rounded-2xl border border-[#17333D] bg-[#08171E] p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto w-fit mb-3 select-none flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2FE5A7] animate-pulse"></span>
            <span className="font-extrabold text-lg tracking-tight text-white font-mono">
              friendoo<span className="text-[#60CECA]">.admin</span>
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-white">Underwriting & Ops Desk</h1>
          <p className="mt-1 text-xs text-[#8BA3AB]">Authenticate to access live governance & desk operations.</p>
        </div>

        {isSignInPaused && (
          <div className="mb-6 rounded-xl border border-[#2FE5A7]/30 bg-[#2FE5A7]/10 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#2FE5A7]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Testing Mode: Sign-in Paused</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-300">
              Authentication requirement is currently paused for testing.
            </p>
            <Link
              href="/admin"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#2FE5A7] px-3.5 py-1.5 text-xs font-bold text-[#041D20] transition hover:bg-[#20cf94]"
            >
              Enter Dashboard Directly
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#8BA3AB]">Admin Password</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                placeholder="Enter password"
                className="w-full rounded-xl border border-[#17333D] bg-[#051016] pl-11 pr-4 py-3 text-white text-sm outline-none transition placeholder:text-[#526B75] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                required={!isSignInPaused}
              />
              <LockKeyhole className="absolute left-4 top-3.5 h-4 w-4 text-[#8BA3AB]" />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#60CECA] px-4 py-3 text-sm font-bold text-[#032024] transition hover:bg-[#72DFDB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-[#60CECA]/10"
          >
            {loading ? 'Authenticating...' : 'Sign In to Desk'}
          </button>
        </form>
      </div>
    </div>
  )
}
