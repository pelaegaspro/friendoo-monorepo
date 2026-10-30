'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutSegment {
  name: string
  value: number
  color: string
  percentage: number
}

interface OrderStatusDonutProps {
  total?: number
  totalLabel?: string
  segments?: DonutSegment[]
}

export default function OrderStatusDonut({
  total = 0,
  totalLabel = 'Total Orders',
  segments = [],
}: OrderStatusDonutProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveSegments = segments
  const displayTotal = total

  if (!mounted) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2">
        <div className="h-44 w-44 rounded-full border-4 border-violet-500/20 animate-pulse" />
      </div>
    )
  }

  if (effectiveSegments.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-violet-400/15 bg-violet-400/[0.06] text-violet-200">
          <span className="h-5 w-5 rounded-full border-2 border-violet-300/30" />
        </div>
        <p className="text-sm font-semibold text-zinc-300">No activity yet</p>
        <p className="text-xs text-zinc-500">Call and payment activity will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart with Centered Count */}
      <div className="relative h-56 w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DonutSegment
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
                        <span>{data.name}:</span>
                        <span className="font-bold">{data.value.toLocaleString()}</span>
                        <span className="text-zinc-400">({data.percentage}%)</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={effectiveSegments}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {effectiveSegments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Content Pill */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            {displayTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-400">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend below donut matching reel */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs w-full max-w-[260px]">
        {effectiveSegments.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-600 dark:text-zinc-300">{item.name}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-white">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
