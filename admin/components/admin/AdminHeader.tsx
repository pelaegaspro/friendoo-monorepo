'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Radio,
  PhoneCall,
  Coins,
  CreditCard,
  ShoppingCart,
  Megaphone,
  FileText,
  Settings,
  Search,
  Plus,
  Bell,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminFetch } from '@/lib/admin/client'
import toast from 'react-hot-toast'

interface NavTab {
  href: string
  label: string
  badgeKey?: 'pendingHosts' | 'unresolvedReports'
}

const navTabs: NavTab[] = [
  { href: '/admin', label: 'Desk' },
  { href: '/admin/users', label: 'Callers' },
  { href: '/admin/hosts', label: 'Voice Hosts', badgeKey: 'pendingHosts' },
  { href: '/admin/calls', label: 'Live Calls' },
  { href: '/admin/packages', label: 'Coin Packages' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/transactions', label: 'Orders' },
  { href: '/admin/ads', label: 'Ad Banners' },
  { href: '/admin/reports', label: 'Reports', badgeKey: 'unresolvedReports' },
  { href: '/admin/support', label: '24/7 Support Desk' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingHostsCount, setPendingHostsCount] = useState<number>(38)
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    adminFetch<{ pendingHostApplications?: number }>('/api/admin/stats')
      .then((res) => {
        if (res?.pendingHostApplications !== undefined) {
          setPendingHostsCount(res.pendingHostApplications)
        }
      })
      .catch(() => {})
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/admin/users?query=${encodeURIComponent(search.trim())}`)
      setShowSearch(false)
    }
  }

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
      toast.success('Signed out')
      window.location.href = '/admin/login'
    } catch {
      toast.error('Logout failed')
    }
  }

  const getSectionName = () => {
    if (pathname === '/admin') return 'Desk'
    const matched = navTabs.find((t) => t.href !== '/admin' && (pathname === t.href || pathname.startsWith(`${t.href}/`)))
    return matched ? matched.label : 'Console'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#162831] bg-[#0B171D]/95 backdrop-blur-2xl select-none">
      {/* 1. Main Moorly Navigation Bar */}
      <div className="mx-auto flex h-14 max-w-[1720px] items-center justify-between px-4 sm:px-6">
        {/* Left: Moorly Brand Capsule + Horizontal Tabs */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          {/* Moorly-style Logo Capsule */}
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2 rounded-full border border-[#245B65] bg-[#143B42] px-3.5 py-1.5 text-white transition hover:bg-[#1A4B54]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#60CECA] text-[#032024] font-black text-xs">
              F
            </div>
            <span className="font-extrabold tracking-tight text-sm text-white">
              Friendoo
            </span>
          </Link>

          {/* Desktop Nav Items (Exact Moorly Capsule Pills) */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navTabs.map((tab) => {
              const active =
                tab.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

              const badgeCount = tab.badgeKey === 'pendingHosts' ? pendingHostsCount : 0

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'group relative flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs transition-all duration-200 shrink-0 font-medium',
                    active
                      ? 'bg-[#60CECA] text-[#032024] font-bold shadow-[0_2px_12px_rgba(96,206,202,0.35)]'
                      : 'text-[#8BA3AB] hover:text-white hover:bg-[#12242D]'
                  )}
                >
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={cn(
                        'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black',
                        active
                          ? 'bg-[#032024]/20 text-[#032024]'
                          : 'bg-[#152B35] text-[#60CECA] border border-[#244858]'
                      )}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* CRM Portal Pill */}
            <a
              href="/crm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition shrink-0 ml-1"
              title="Open Dedicated CRM Service"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CRM</span>
              <ExternalLink className="h-3 w-3 text-purple-400" />
            </a>
          </nav>
        </div>

        {/* Right Controls (Search, + New, Theme, Notifications, Avatar) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Search Button */}
          <div className="relative">
            {showSearch ? (
              <form onSubmit={handleSearch} className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7B96A0]" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => !search && setShowSearch(false)}
                  placeholder="Search callers, hosts..."
                  className="w-full rounded-full border border-[#245B65] bg-[#071318] py-1 pl-9 pr-3 text-xs text-white placeholder-[#7B96A0] outline-none ring-2 ring-[#60CECA]/30"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1B2F38] bg-[#0E1E26] text-[#8BA3AB] hover:text-white hover:border-[#2D4D5C] active:scale-[0.95] transition-all duration-90 ease-out"
                aria-label="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* "+ New" Action Button (Exact Moorly Mint Capsule) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="flex items-center gap-1.5 rounded-full bg-[#60CECA] hover:bg-[#4EBDB9] active:scale-[0.96] px-3.5 py-1 text-xs font-bold text-[#032024] shadow-[0_2px_12px_rgba(96,206,202,0.3)] transition-all duration-90 ease-out"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>New</span>
            </button>

            {showNewMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#1E3A46] bg-[#0A1820] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowNewMenu(false)}
              >
                <Link
                  href="/admin/packages"
                  onClick={() => setShowNewMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#122A36] hover:text-white transition"
                >
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span>Add Coin Package</span>
                </Link>
                <Link
                  href="/admin/ads"
                  onClick={() => setShowNewMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#122A36] hover:text-white transition"
                >
                  <Megaphone className="h-3.5 w-3.5 text-purple-400" />
                  <span>Create Ad Campaign</span>
                </Link>
                <Link
                  href="/admin/hosts"
                  onClick={() => setShowNewMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#122A36] hover:text-white transition"
                >
                  <Radio className="h-3.5 w-3.5 text-[#60CECA]" />
                  <span>Review Host Leads</span>
                </Link>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => router.push('/admin/notifications')}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#1B2F38] bg-[#0E1E26] text-[#8BA3AB] hover:text-white transition"
            aria-label="View notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            {pendingHostsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                {pendingHostsCount}
              </span>
            )}
          </button>

          {/* Admin Avatar Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 rounded-full border border-[#1B2F38] bg-[#0E1E26] pl-1 pr-2.5 py-1 text-xs text-white hover:border-[#2D4D5C] transition"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#183B44] text-[#60CECA] font-extrabold text-[10px]">
                NL
              </div>
              <ChevronDown className="h-3 w-3 text-[#7B96A0]" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#1E3A46] bg-[#0A1820] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2 border-b border-[#162B35]">
                  <p className="font-bold text-xs text-white">Friendoo Governance</p>
                  <p className="text-[10px] text-[#7B96A0]">admin@friendoo.in</p>
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#122A36] hover:text-white transition mt-1"
                >
                  <Settings className="h-3.5 w-3.5 text-[#7B96A0]" />
                  <span>Platform Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden flex h-8 w-8 items-center justify-center rounded-full border border-[#1B2F38] bg-[#0E1E26] text-zinc-300 hover:text-white"
            aria-label="Toggle Navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 2. Moorly Sub-Header: Workspace Breadcrumb & Saltgate Live Status Beacon */}
      <div className="border-t border-[#13232A] bg-[#061217] px-4 sm:px-6 py-2">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between text-[11px] font-medium text-[#7B96A0]">
          <div className="flex items-center gap-2">
            <span className="text-[#5A737E]">Workspace</span>
            <span className="text-[#3F545D]">&gt;</span>
            <span className="font-bold text-[#A6C5CE]">{getSectionName()}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FE5A7] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2FE5A7]" />
              </span>
              <span className="font-semibold text-[#2FE5A7]">Saltgate desk online</span>
            </div>
            {currentTime && (
              <>
                <span className="text-[#2F444D]">·</span>
                <span className="text-[#7B96A0] font-mono text-[10px]">{currentTime}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav id="admin-mobile-navigation" aria-label="Admin navigation" className="xl:hidden border-t border-[#162831] bg-[#0B171D] p-3 space-y-1">
          {navTabs.map((tab) => {
            const active =
              tab.href === '/admin'
                ? pathname === '/admin'
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold',
                  active
                    ? 'bg-[#60CECA] text-[#032024] font-bold'
                    : 'text-[#8BA3AB] hover:text-white hover:bg-[#12242D]'
                )}
              >
                <span>{tab.label}</span>
                {tab.badgeKey === 'pendingHosts' && pendingHostsCount > 0 && (
                  <span className="rounded-full bg-[#152B35] text-[#60CECA] px-2 py-0.5 text-[10px] font-bold border border-[#244858]">
                    {pendingHostsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
