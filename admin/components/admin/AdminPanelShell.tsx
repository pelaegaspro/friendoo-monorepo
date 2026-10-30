'use client'

import React from 'react'
import AdminHeader from './AdminHeader'

export default function AdminPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-[#040D12] text-slate-100 selection:bg-[#60CECA] selection:text-[#041D20] flex flex-col antialiased relative overflow-x-hidden">
      {/* 4K Glass Specular & Ambient Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[500px] w-[1000px] rounded-full bg-gradient-to-b from-[#60CECA]/10 via-[#2FE5A7]/5 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] h-[400px] w-[600px] rounded-full bg-[#38BDF8]/5 blur-[140px]" />
        <div className="absolute bottom-0 right-[5%] h-[500px] w-[700px] rounded-full bg-[#60CECA]/6 blur-[150px]" />
      </div>

      {/* Moorly-style Top Navigation Header */}
      <div className="relative z-30">
        <AdminHeader />
      </div>

      {/* Full-width Workspace Container */}
      <main className="relative z-10 flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
