import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'
  trend?: string
}

const colorMap = {
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function StatCard({ label, value, icon: Icon, color = 'purple', trend }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {trend && <p className="text-gray-500 text-xs mt-1">{trend}</p>}
      </div>
    </div>
  )
}
