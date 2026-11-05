'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  helper?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
  color?: 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'orange' | 'green'
  trend?: { value: string | number; label?: string; isUp?: boolean; neutral?: boolean }
  variant?: 'gradient' | 'glass'
  className?: string
}

const accentColors: Record<NonNullable<StatCardProps['color']>, string> = {
  blue: 'text-blue-300 bg-blue-400/10',
  purple: 'text-violet-300 bg-violet-400/10',
  orange: 'text-orange-300 bg-orange-400/10',
  amber: 'text-amber-300 bg-amber-400/10',
  green: 'text-emerald-300 bg-emerald-400/10',
  emerald: 'text-emerald-300 bg-emerald-400/10',
  cyan: 'text-cyan-300 bg-cyan-400/10',
  rose: 'text-rose-300 bg-rose-400/10',
  indigo: 'text-indigo-300 bg-indigo-400/10',
}

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  color = 'blue',
  trend,
  className = '',
}: StatCardProps) {
  const accent = accentColors[color]

  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
            <Icon size={20} className="stroke-[2]" />
          </div>
        ) : <span />}
        {trend ? (
          <div className={`inline-flex items-center gap-1 text-xs font-semibold ${trend.isUp ? 'text-emerald-300' : trend.neutral ? 'text-slate-400' : 'text-rose-300'}`}>
            {trend.neutral ? <Minus size={13} /> : trend.isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend.value}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-white lg:text-3xl">{value}</h3>
      </div>
      {helper || trend?.label ? <p className="mt-2 text-xs text-slate-400">{helper || trend?.label}</p> : null}
    </section>
  )
}
