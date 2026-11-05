'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  LineChart,
  Coins,
  Megaphone,
  ShoppingCart,
  Users,
  Radio,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminFetch } from '@/lib/admin/client'
import toast from 'react-hot-toast'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calls', label: 'Analytics', icon: LineChart },
  { href: '/admin/packages', label: 'Coin Packages', icon: Coins },
  { href: '/admin/ads', label: 'Ad Banners & Offers', icon: Megaphone },
  { href: '/admin/transactions', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Callers', icon: Users },
  { href: '/admin/hosts', label: 'Voice Hosts', icon: Radio },
  { href: '/admin/notifications', label: 'Messages', icon: MessageSquare },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-300 transition hover:bg-white/[0.08]"
      aria-label="Open sidebar"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}

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
    <div className="flex h-full flex-col justify-between border-r border-border bg-surface p-4 text-slate-300 select-none overflow-y-auto">
      <div>
        <div className="mb-7 flex items-center justify-between px-2 pt-2">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 group"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[#111827]">
              <span className="font-black text-sm tracking-tighter">FP</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">
                  Friendoo
                </span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-500">ADMIN CONSOLE</p>
            </div>
          </Link>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                  active
                    ? 'border-border bg-surface-elevated text-white'
                    : 'border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-violet-200' : 'text-slate-500'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/[0.06] space-y-2">
        <a
          href="/crm"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-[#293548] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span>CRM Operations</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
        </a>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarBody onClose={onClose} />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-64 z-50">
            <SidebarBody onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
