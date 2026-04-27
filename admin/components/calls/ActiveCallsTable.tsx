'use client'

import { useEffect, useState } from 'react'
import { Radio, Clock } from 'lucide-react'
import { Call } from '@/types'
import { formatDate, formatDuration } from '@/lib/utils/formatters'

interface Props {
  calls: Call[]
  onJoin: (call: Call) => void
}

export default function ActiveCallsTable({ calls, onJoin }: Props) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (calls.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Radio className="mx-auto mb-3 opacity-40" size={40} />
        <p>No active calls right now</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-left">
            <th className="pb-3 pr-4 font-medium">Channel ID</th>
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Host</th>
            <th className="pb-3 pr-4 font-medium">
              <span className="flex items-center gap-1">
                <Clock size={14} /> Start Time
              </span>
            </th>
            <th className="pb-3 pr-4 font-medium">Duration</th>
            <th className="pb-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const elapsed = Math.floor(
              (Date.now() - call.startedAt.toDate().getTime()) / 1000
            )
            return (
              <tr key={call.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                <td className="py-3 pr-4 font-mono text-xs text-gray-300">
                  {call.channelId.length > 16
                    ? `${call.channelId.slice(0, 16)}…`
                    : call.channelId}
                </td>
                <td className="py-3 pr-4 text-white">{call.userName}</td>
                <td className="py-3 pr-4 text-white">{call.hostName}</td>
                <td className="py-3 pr-4 text-gray-300">{formatDate(call.startedAt)}</td>
                <td className="py-3 pr-4 font-mono text-green-400">
                  {formatDuration(elapsed)}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => onJoin(call)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition-colors"
                  >
                    <Radio size={12} />
                    Join Silently
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
