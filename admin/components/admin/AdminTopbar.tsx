'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Calendar, Sparkles } from 'lucide-react'
import { MobileSidebarButton } from './AdminSidebar'

export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/admin/users?query=${encodeURIComponent(search.trim())}`)
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#090A0F]/85 px-4 py-3 backdrop-blur-2xl sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <MobileSidebarButton onClick={onOpenSidebar} />

          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anything..."
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/10"
            />
          </form>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-slate-300 sm:flex">
            <Calendar size={14} className="text-violet-300" />
            <span>{currentDate}</span>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-300 transition hover:bg-white/[0.08]"
            aria-label="View notifications"
          >
            <Bell size={16} />
          </button>

          <div className="flex items-center gap-2.5 border-l border-white/[0.08] pl-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[#111827]">
              <span className="absolute inset-[3px] rounded-full bg-[#15101e]" />
              <Sparkles size={15} className="relative z-10 text-violet-100" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-none text-white">
                Admin
              </p>
              <p className="mt-1 text-[10px] font-medium text-slate-500">
                Friendoo
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
