'use client'

import React from 'react'
import AdminHeader from './AdminHeader'

export default function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-slate-100 selection:bg-[#5EEAD4] selection:text-[#111827] flex flex-col antialiased">

      {/* Moorly-style Top Navigation Header */}
      <div className="z-30">
        <AdminHeader />
      </div>

      {/* Full-width Workspace Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
