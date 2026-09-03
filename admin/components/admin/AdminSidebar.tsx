'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserRound, Coins,
  ReceiptText, Phone, Settings, Menu, Bell,
  ShieldAlert, CreditCard, Eye, AlertCircle,
    Search, LogOut, Sparkles

} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminFetch } from '@/lib/admin/client'
import toast from 'react-hot-toast'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const mainNavItems = [
  { href: '/admin', label: 'Overview Bento', icon: LayoutDashboard, badge: 'Live' },
  { href: '/admin/ads', label: 'Cloud Ad Banners', icon: Sparkles, badge: 'Cloud' },
  { href: '/admin/hosts', label: 'Host Management', icon: Users },
  { href: '/admin/users', label: 'User Directory', icon: UserRound },
  { href: '/admin/packages', label: 'Coin Packages', icon: Coins, badge: '₹' },
  { href: '/admin/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/admin/calls', label: 'WebRTC Sessions', icon: Phone },
  { href: '/admin/payments', label: 'Payout Approvals', icon: CreditCard },
  { href: '/admin/notifications', label: 'Push Campaigns', icon: Bell },
  { href: '/admin/reports', label: 'User Reports', icon: ShieldAlert },
]

const surveillanceItems = [
  { href: '/admin/surveillance/users', label: 'Behavioral Radar', icon: Eye },
  { href: '/admin/surveillance/fraud', label: 'Fraud Sentry', icon: AlertCircle, alert: true },
]

function SidebarBody({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
      router.replace('/admin/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <div className="flex h-full flex-col justify-between bg-surface/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div>
        {/* Logo & Platform Tag */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 select-none group">
            <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto transition-transform group-hover:scale-105">
              <defs>
                <linearGradient id="logoGradAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <text x="0" y="22" fill="url(#logoGradAdmin)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
            </svg>
            <span className="bento-badge text-[10px] text-purple-300 font-mono uppercase">
              Admin Bento
            </span>
          </Link>
        </div>

        {/* Quick Search Shortcut */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Search hosts, users, calls...</span>
          <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
        </div>

        {/* Primary Operations */}
        <div className="space-y-4">
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Core Operations
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                      active
                        ? "border-purple-500/30 bg-purple-500/15 text-purple-200 shadow-sm"
                        : "border-transparent text-muted-foreground hover:border-purple-500/20 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 transition-colors", active ? "text-purple-400" : "text-muted-foreground group-hover:text-purple-400")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Intelligence & Risk
            </div>
            <nav className="space-y-1">
              {surveillanceItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                      active
                        ? "border-red-500/30 bg-red-500/15 text-red-200 shadow-sm"
                        : "border-transparent text-muted-foreground hover:border-red-500/20 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 transition-colors", active ? "text-red-400" : "text-muted-foreground group-hover:text-red-400")} />
                      <span>{item.label}</span>
                    </div>
                    {item.alert && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              System
            </div>
            <Link
              href="/admin/settings"
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                pathname === '/admin/settings'
                  ? "border-purple-500/30 bg-purple-500/15 text-purple-200 shadow-sm"
                  : "border-transparent text-muted-foreground hover:border-purple-500/20 hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-purple-400" />
                <span>System Config</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* User Card & Logout */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
              AD
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Super Administrator</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Live Session
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit Admin Panel</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/80 lg:block">
        <SidebarBody onClose={onClose} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close navigation" />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-border shadow-2xl z-50">
            <SidebarBody onClose={onClose} />
          </div>
        </div>
      ) : null}
    </>
  )
}

export function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground lg:hidden"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
