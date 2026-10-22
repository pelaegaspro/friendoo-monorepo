'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  LineChart,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
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
  { href: '/admin/packages', label: 'Products', icon: Package },
  { href: '/admin/transactions', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Customers (CRM)', icon: Users },
  { href: '/admin/notifications', label: 'Messages', icon: MessageSquare },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
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
    <div className="flex h-full flex-col justify-between border-r border-white/[0.06] bg-[#0B0C12]/95 p-4 text-slate-300 shadow-[16px_0_60px_-40px_rgba(139,92,246,0.6)] backdrop-blur-2xl select-none overflow-y-auto">
      <div>
        <div className="mb-7 flex items-center justify-between px-2 pt-2">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 group"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-[0_0_24px_rgba(168,85,247,0.3)] transition-transform group-hover:scale-105">
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
                    ? 'border-violet-400/20 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/5 text-white shadow-[inset_2px_0_0_#a78bfa]'
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

      <div className="mt-6 space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] via-[#14121d] to-cyan-500/[0.06] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">Workspace</span>
          </div>
          <h4 className="text-xs font-bold text-white">Operations console</h4>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">
            Manage members, hosts, calls and payments from one place.
          </p>
        </div>

        {/* Sign Out link */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:border-rose-500/20"
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
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarBody onClose={onClose} />
      </aside>
    </>
  )
}

export function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08] lg:hidden"
      aria-label="Open sidebar navigation"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
