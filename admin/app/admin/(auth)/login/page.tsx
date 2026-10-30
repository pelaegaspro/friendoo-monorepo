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

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#8BA3AB]">Admin Password</span>
            <div className="relative">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter password"
                className="w-full rounded-xl border border-[#17333D] bg-[#051016] pl-11 pr-4 py-3 text-white text-sm outline-none transition placeholder:text-[#526B75] focus:border-[#60CECA] focus:ring-1 focus:ring-[#60CECA]"
                required
              />
              <LockKeyhole className="absolute left-4 top-3.5 h-4 w-4 text-[#8BA3AB]" />
            </div>
          </label>

          <div className="flex items-center justify-between text-xs text-[#8BA3AB]">
            <span>Password: <strong className="text-[#60CECA] font-mono">friendoo-admin</strong></span>
            <button
              type="button"
              onClick={() => setPassword("friendoo-admin")}
              className="text-[#60CECA] hover:underline hover:text-[#7DE2DE] font-medium"
            >
              Autofill
            </button>
          </div>

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
