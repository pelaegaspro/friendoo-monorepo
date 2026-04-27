'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/admin/client'
import { MobileSidebarButton } from './AdminSidebar'

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/hosts': 'Host Management',
  '/admin/users': 'User Management',
  '/admin/packages': 'Coin Packages',
  '/admin/transactions': 'Transactions',
  '/admin/calls': 'Call History',
  '/admin/settings': 'Settings',
}

export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const title = useMemo(() => titles[pathname] ?? 'Friendoo Admin', [pathname])

  const logout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
      router.replace('/admin/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logout failed')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#242424] bg-[#0f0f0f]/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebarButton onClick={onOpenSidebar} />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Friendoo Admin</p>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl border border-[#303030] bg-[#181818] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-purple-500/40 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  )
}
