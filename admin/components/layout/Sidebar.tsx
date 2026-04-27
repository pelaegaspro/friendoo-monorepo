'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Mic, CalendarDays, CreditCard,
  Phone, AlertTriangle, Mail, Bell, Settings, LogOut
} from 'lucide-react'
import { signOutAdmin } from '@/lib/auth'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dashboard/users',        label: 'Users',          icon: Users },
  { href: '/dashboard/hosts',        label: 'Hosts',          icon: Mic },
  { href: '/dashboard/bookings',     label: 'Bookings',       icon: CalendarDays },
  { href: '/dashboard/payments',     label: 'Payments',       icon: CreditCard },
  { href: '/dashboard/calls',        label: 'Live Calls',     icon: Phone },
  { href: '/dashboard/reports',      label: 'Reports',        icon: AlertTriangle },
  { href: '/dashboard/emails',       label: 'Email Center',   icon: Mail },
  { href: '/dashboard/notifications',label: 'Notifications',  icon: Bell },
  { href: '/dashboard/settings',     label: 'Settings',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOutAdmin()
      router.push('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-950 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Friendoo</p>
            <p className="text-gray-500 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
