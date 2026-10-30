'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  revenue: number
}

interface RevenueChartProps {
  data: DataPoint[]
  title?: string
}

export default function RevenueChart({ data, title = 'Revenue Overview' }: RevenueChartProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = data
  const totalRevenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0)

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium">Loading telemetry...</p>
          </div>
        </div>
        <div className="h-[250px] w-full rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium">
            Last 14 days · ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="relative">
          <span
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            <span>Last 14 days</span>
          </span>
        </div>
      </div>

      <div className="h-[250px] w-full relative">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-sm text-zinc-500">
            No revenue activity for this period.
          </div>
        ) : <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 18, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#14B8A6" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200/80 dark:text-white/5"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(val) => {
                if (val >= 100000) return `${Math.round(val / 1000)}K`
                if (val >= 1000) return `${Math.round(val / 1000)}K`
                return String(val)
              }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value) || 0
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white shadow-2xl backdrop-blur-md">
                      <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
                      <p className="text-sm font-extrabold text-blue-400">
                        ₹{val.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2DD4BF"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueAreaGradient)"
              activeDot={{
                r: 6,
                fill: '#2DD4BF',
                stroke: '#0C101A',
                strokeWidth: 2.5,
                className: 'filter drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>}
      </div>
    </div>
  )
}
