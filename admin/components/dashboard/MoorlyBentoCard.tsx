'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MoorlyBentoCardProps {
  label: string
  value: string | number
  helper?: string
  trend?: {
    value: string | number
    label: string
    isUp?: boolean
    neutral?: boolean
  }
  sparklineColor?: 'teal' | 'gold' | 'blue' | 'bronze'
  sparklineData?: number[]
  className?: string
  onClick?: () => void
}

export default function MoorlyBentoCard({
  label,
  value,
  helper,
  trend,
  sparklineColor = 'teal',
  sparklineData = [12, 18, 14, 25, 20, 32, 28, 42, 38, 55],
  className,
  onClick,
}: MoorlyBentoCardProps) {
  // Generate smooth SVG sparkline curve
  const width = 110
  const height = 34
  const min = Math.min(...sparklineData)
  const max = Math.max(...sparklineData)
  const range = max - min || 1

  const points = sparklineData.map((val, idx) => {
    const x = (idx / (sparklineData.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 8) - 4
    return { x, y }
  })

  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cpX = (p0.x + p1.x) / 2
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`
  }

  // Exact hex colors sampled from Moorly reel
  const colorStyles = {
    teal: {
      bg: 'bg-[#06161D]',
      border: 'border-[#15333F]',
      stroke: '#4DE3D0',
      label: 'text-[#7B96A0]',
      helper: 'text-[#7B96A0]',
      pill: 'bg-[#0E282E] text-[#4DE3D0] border-[#1C4752]',
    },
    gold: {
      bg: 'bg-[#16211C]',
      border: 'border-[#2A3B33]',
      stroke: '#82D9A7',
      label: 'text-[#8C9B93]',
      helper: 'text-[#8C9B93]',
      pill: 'bg-[#152B20] text-[#82D9A7] border-[#224A35]',
    },
    blue: {
      bg: 'bg-[#0E1722]',
      border: 'border-[#1D2C3D]',
      stroke: '#64B5F6',
      label: 'text-[#869BB0]',
      helper: 'text-[#869BB0]',
      pill: 'bg-[#142333] text-[#64B5F6] border-[#203D5C]',
    },
    bronze: {
      bg: 'bg-[#231C12]',
      border: 'border-[#403320]',
      stroke: '#F59E0B',
      label: 'text-[#A89A84]',
      helper: 'text-[#A89A84]',
      pill: 'bg-[#162B1A] text-[#4ADE80] border-[#244E2C]',
    },
  }[sparklineColor]

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all duration-200 select-none',
        colorStyles.bg,
        colorStyles.border,
        onClick && 'cursor-pointer hover:border-opacity-80',
        className
      )}
    >
      {/* Top Header & Trend Pill */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-xs font-semibold tracking-wide', colorStyles.label)}>
          {label}
        </span>
        {trend && (
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight',
              colorStyles.pill
            )}
          >
            {trend.value} {trend.label}
          </span>
        )}
      </div>

      {/* Metric Value & Exact SVG Sparkline */}
      <div className="mt-3 mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {value}
        </span>

        {/* Micro Sparkline Curve (Exact Moorly look) */}
        <div className="relative shrink-0">
          <svg
            width={width}
            height={height}
            className="overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
          >
            <path
              d={pathD}
              fill="none"
              stroke={colorStyles.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Footer Helper Text */}
      {helper && (
        <div className={cn('mt-0.5 text-[11px] font-medium truncate', colorStyles.helper)}>
          {helper}
        </div>
      )}
    </div>
  )
}
