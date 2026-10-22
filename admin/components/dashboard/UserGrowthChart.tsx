'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { UserPlus, Sparkles } from 'lucide-react'

import { useState, useEffect } from 'react'

interface DataPoint {
  date: string
  users: number
}

export default function UserGrowthChart({ data }: { data: DataPoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[240px] w-full rounded-xl bg-white/[0.02] animate-pulse" />
  }

  const totalUsers = data.reduce((acc, curr) => acc + (curr.users || 0), 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <UserPlus size={14} />
            </span>
            <p className="text-sm font-semibold text-zinc-300">Customer Acquisition</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white tracking-tight">
            +{totalUsers.toLocaleString('en-IN')}
            <span className="ml-2 text-xs font-normal text-zinc-500">new registrations</span>
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Sparkles size={13} />
          <span>Active Onboarding</span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="userBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              dx={-4}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value) || 0
                  return (
                    <div className="rounded-xl border border-cyan-500/30 bg-[#0f111a]/95 p-3 shadow-2xl backdrop-blur-xl">
                      <p className="text-[11px] font-semibold text-zinc-400">{label}</p>
                      <p className="mt-1 text-base font-bold text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        +{val.toLocaleString('en-IN')} Users
                      </p>
                      <p className="text-[10px] text-cyan-300/80 font-medium mt-0.5">
                        New Mobile Signups
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="users"
              fill="url(#userBarGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
