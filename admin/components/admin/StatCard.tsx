'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  helper?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
  color?: 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'orange' | 'green'
  trend?: {
    value: string | number
    label?: string
    isUp?: boolean
    neutral?: boolean
  }
  variant?: 'gradient' | 'glass'
  className?: string
}

const gradientStyles: Record<string, { bg: string; shadow: string }> = {
  blue: {
    bg: 'bg-gradient-to-br from-[#2563EB] to-[#3B82F6]',
    shadow: 'shadow-lg shadow-blue-500/25',
  },
  purple: {
    bg: 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6]',
    shadow: 'shadow-lg shadow-purple-500/25',
  },
  orange: {
    bg: 'bg-gradient-to-br from-[#F97316] to-[#FB923C]',
    shadow: 'shadow-lg shadow-orange-500/25',
  },
  amber: {
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]',
    shadow: 'shadow-lg shadow-amber-500/25',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#10B981] to-[#34D399]',
    shadow: 'shadow-lg shadow-emerald-500/25',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-[#10B981] to-[#34D399]',
    shadow: 'shadow-lg shadow-emerald-500/25',
  },
  cyan: {
    bg: 'bg-gradient-to-br from-[#06B6D4] to-[#38BDF8]',
    shadow: 'shadow-lg shadow-cyan-500/25',
  },
  rose: {
    bg: 'bg-gradient-to-br from-[#F43F5E] to-[#FB7185]',
    shadow: 'shadow-lg shadow-rose-500/25',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-[#6366F1] to-[#818CF8]',
    shadow: 'shadow-lg shadow-indigo-500/25',
  },
}

export default function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  color = 'blue',
  trend,
  variant = 'gradient',
  className = '',
}: StatCardProps) {
  if (variant === 'gradient') {
    const grad = gradientStyles[color] || gradientStyles.blue

    return (
      <div
        className={`relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${grad.bg} ${grad.shadow} ${className}`}
      >
        {/* Soft Background Radial Light */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />

        {/* Top Row: Icon Container + Trend Pill */}
        <div className="flex items-start justify-between gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 border border-white/25 text-white backdrop-blur-md shadow-sm">
              <Icon size={22} className="stroke-[2.2]" />
            </div>
          )}

          {trend && (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md">
              {trend.neutral ? (
                <Minus size={12} />
              ) : trend.isUp ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {/* Label & Value */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-white/85 tracking-wide">
            {label}
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">
            {value}
          </h3>
        </div>

        {/* Helper */}
        {(helper || trend?.label) && (
          <p className="mt-2 text-[11px] font-medium text-white/75">
            {helper || trend?.label}
          </p>
        )}
      </div>
    )
  }

  const accentColors: Record<string, string> = {
    blue: 'bg-blue-400 shadow-blue-400/20',
    purple: 'bg-violet-400 shadow-violet-400/20',
    orange: 'bg-orange-400 shadow-orange-400/20',
    amber: 'bg-amber-400 shadow-amber-400/20',
    green: 'bg-emerald-400 shadow-emerald-400/20',
    emerald: 'bg-emerald-400 shadow-emerald-400/20',
    cyan: 'bg-cyan-400 shadow-cyan-400/20',
    rose: 'bg-rose-400 shadow-rose-400/20',
    indigo: 'bg-indigo-400 shadow-indigo-400/20',
  }
  const accent = accentColors[color] || accentColors.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.28 }}
      className={`group relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121b]/90 p-5 shadow-[0_12px_38px_-26px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_22px_55px_-28px_rgba(139,92,246,0.32)] ${className}`}
    >
      <span className={`pointer-events-none absolute -right-9 -top-10 h-32 w-32 rounded-full opacity-[0.12] blur-3xl transition-opacity duration-300 group-hover:opacity-25 ${accent}`} />
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-violet-200 shadow-inner">
            <Icon size={20} className="stroke-[2.2]" />
          </div>
        )}
        {trend && (
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2 py-0.5 text-xs font-semibold text-emerald-300">
            {trend.neutral ? <Minus size={12} /> : trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {label}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-white lg:text-3xl">
          {value}
        </h3>
      </div>
      {helper && <p className="mt-2 text-xs text-zinc-500">{helper}</p>}
      <div className="mt-4 h-px overflow-hidden bg-white/[0.05]">
        <div className={`h-full w-1/3 rounded-full opacity-50 transition-all duration-700 group-hover:w-2/3 ${accent}`} />
      </div>
    </motion.div>
  )
}
