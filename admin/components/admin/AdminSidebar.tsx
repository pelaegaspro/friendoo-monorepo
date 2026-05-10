'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, UserRound, Coins, 
  ReceiptText, Phone, Settings, Menu, Bell, 
  ShieldAlert, CreditCard, Eye, 
  MessageSquare, AlertCircle 
} from 'lucide-react'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/hosts', label: 'Hosts', icon: Users },
  { href: '/admin/users', label: 'Users', icon: UserRound },
  { href: '/admin/packages', label: 'Packages', icon: Coins },
  { href: '/admin/transactions', label: 'Transactions', icon: ReceiptText },
  { href: '/admin/calls', label: 'Calls', icon: Phone },
  { href: '/admin/payments', label: 'Payouts', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
]

const surveillanceItems = [
  { href: '/admin/surveillance/users', label: 'User Activity', icon: Eye },
  { href: '/admin/surveillance/chats', label: 'Chat Monitor', icon: MessageSquare },
  { href: '/admin/surveillance/fraud', label: 'Fraud Alerts', icon: AlertCircle },
]

function SidebarBody({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-[#121212] overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-[#242424] px-5 py-5 sticky top-0 bg-[#121212] z-10">
        <div className="bg-white px-2.5 py-1.5 rounded-xl flex items-center justify-center">
          <img src="/logo.png" alt="Friendoo" className="h-6 w-auto object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Friendoo Admin</p>
          <p className="text-xs text-zinc-500">Control center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Management</p>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30'
                  : 'text-zinc-400 hover:bg-[#1d1d1d] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}

        <div className="pt-6 pb-2">
          <p className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Surveillance</p>
        </div>
        {surveillanceItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30'
                  : 'text-zinc-400 hover:bg-[#1d1d1d] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}

        <div className="pt-6 pb-2">
          <p className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System</p>
        </div>
        <Link
          href="/admin/settings"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === '/admin/settings'
              ? 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30'
              : 'text-zinc-400 hover:bg-[#1d1d1d] hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  )
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-[#242424] bg-[#121212] lg:block">
        <SidebarBody onClose={onClose} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close navigation" />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-[#242424] shadow-2xl z-50">
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#303030] bg-[#181818] text-zinc-300 lg:hidden"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
