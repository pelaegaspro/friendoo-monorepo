'use client'

import { Bell } from 'lucide-react'
import { useAdminAuth } from '@/lib/auth'
import { useAdminNotifications } from '@/hooks/useAdminNotifications'
import { formatRelativeDate } from '@/lib/utils/formatters'
import { Timestamp } from 'firebase/firestore'

export default function TopBar() {
  const { user } = useAdminAuth()
  const notifCount = useAdminNotifications()

  const lastLogin = user?.metadata?.lastSignInTime
    ? formatRelativeDate(Timestamp.fromDate(new Date(user.metadata.lastSignInTime)))
    : '—'

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6 z-30">
      <div />
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Bell size={20} />
          </button>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </div>

        {/* Admin Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-white text-sm font-medium">
              {user?.displayName ?? 'Admin'}
            </p>
            <p className="text-gray-500 text-xs">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
