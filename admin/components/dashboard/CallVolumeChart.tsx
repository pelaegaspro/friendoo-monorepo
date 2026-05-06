'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface DataPoint {
  date: string
  calls: number
}

export default function CallVolumeChart({ data }: { data: DataPoint[] }) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-zinc-400">Call Volume — Last 14 Days</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#131313', border: '1px solid #2d2d2d', borderRadius: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#22c55e' }}
            formatter={(value: number) => [value, 'Calls']}
          />
          <Area type="monotone" dataKey="calls" stroke="#22c55e" fill="url(#callGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
