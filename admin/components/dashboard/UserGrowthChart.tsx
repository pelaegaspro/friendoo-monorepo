'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface DataPoint {
  date: string
  users: number
}

export default function UserGrowthChart({ data }: { data: DataPoint[] }) {
  return (
    <div>
      <p className="mb-4 text-sm font-medium text-zinc-400">New Users — Last 14 Days</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#131313', border: '1px solid #2d2d2d', borderRadius: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#06b6d4' }}
            formatter={(value: number) => [value, 'New Users']}
          />
          <Bar dataKey="users" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
