'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface DataPoint {
  date: string
  revenue: number
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-zinc-400">Daily Revenue (₹) — Last 14 Days</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            contentStyle={{ background: '#131313', border: '1px solid #2d2d2d', borderRadius: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#a855f7' }}
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#a855f7" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
