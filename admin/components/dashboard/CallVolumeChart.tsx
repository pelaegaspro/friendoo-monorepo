'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PhoneCall, Activity } from 'lucide-react'

import { useState, useEffect } from 'react'

interface DataPoint {
  date: string
  calls: number
}

export default function CallVolumeChart({ data }: { data: DataPoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[240px] w-full rounded-xl bg-white/[0.02] animate-pulse" />
  }

  const totalCalls = data.reduce((acc, curr) => acc + (curr.calls || 0), 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <PhoneCall size={14} />
            </span>
            <p className="text-sm font-semibold text-zinc-300">Voice Sessions Volume</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white tracking-tight">
            {totalCalls.toLocaleString('en-IN')}
            <span className="ml-2 text-xs font-normal text-zinc-500">total calls</span>
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Activity size={13} className="animate-pulse" />
          <span>WebRTC Connected</span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="modernCallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#10b981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value) || 0
                  return (
                    <div className="rounded-xl border border-emerald-500/30 bg-[#0f111a]/95 p-3 shadow-2xl backdrop-blur-xl">
                      <p className="text-[11px] font-semibold text-zinc-400">{label}</p>
                      <p className="mt-1 text-base font-bold text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {val.toLocaleString('en-IN')} Calls
                      </p>
                      <p className="text-[10px] text-emerald-300/80 font-medium mt-0.5">
                        Completed & Settled
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#modernCallGrad)"
              activeDot={{
                r: 6,
                fill: '#10b981',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
