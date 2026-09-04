'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, LogOut, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/admin/client'
import { MobileSidebarButton } from './AdminSidebar'

const titles: Record<string, string> = {
  '/admin': 'Overview Dashboard',
  '/admin/ads': 'Cloud Ad Banners',
  '/admin/hosts': 'Host Management',
  '/admin/users': 'User Management',
  '/admin/packages': 'Coin Packages & Pricing',
  '/admin/transactions': 'Financial Ledger',
  '/admin/calls': 'Live WebRTC Matrix',
  '/admin/payments': 'Payouts & Settlement',
  '/admin/notifications': 'Push Notifications & Alerts',
  '/admin/reports': 'Safety & Moderation',
  '/admin/surveillance/users': 'Behavioral Telemetry',
  '/admin/surveillance/fraud': 'Fraud & Integrity Sentry',
  '/admin/settings': 'System Configuration',
}

export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const title = useMemo(() => titles[pathname] ?? 'Admin Matrix', [pathname])

  const logout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
      router.replace('/admin/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logout failed')
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MobileSidebarButton onClick={onOpenSidebar} />
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">Friendoo Ops Center</span>
              <span>/</span>
              <span className="text-purple-400 font-mono">{title}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>System Status: Online</span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Root Admin</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 lg:hidden"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
