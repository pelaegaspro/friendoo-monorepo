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
      router.replace('/admin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#2b2b2b] bg-[#161616] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500">
            <LockKeyhole className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-white">Friendoo Admin</h1>
          <p className="mt-2 text-sm text-zinc-400">Enter the admin password to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Admin Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Enter admin password"
              className="w-full rounded-2xl border border-[#343434] bg-[#101010] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
