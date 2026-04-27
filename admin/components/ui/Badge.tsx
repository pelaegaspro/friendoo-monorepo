interface BadgeProps {
  label: string
  variant?: 'active' | 'banned' | 'suspended' | 'pending' | 'approved' | 'rejected' |
            'open' | 'investigating' | 'resolved' | 'dismissed' |
            'high' | 'medium' | 'low' |
            'captured' | 'refunded' | 'failed' |
            'completed' | 'cancelled' | 'paid' |
            'verified' | 'default'
}

const variantClasses: Record<string, string> = {
  active:       'bg-green-500/20 text-green-400 border-green-500/30',
  approved:     'bg-green-500/20 text-green-400 border-green-500/30',
  captured:     'bg-green-500/20 text-green-400 border-green-500/30',
  completed:    'bg-green-500/20 text-green-400 border-green-500/30',
  paid:         'bg-green-500/20 text-green-400 border-green-500/30',
  verified:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  investigating:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  medium:       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  open:         'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high:         'bg-red-500/20 text-red-400 border-red-500/30',
  banned:       'bg-red-500/20 text-red-400 border-red-500/30',
  rejected:     'bg-red-500/20 text-red-400 border-red-500/30',
  failed:       'bg-red-500/20 text-red-400 border-red-500/30',
  suspended:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  dismissed:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  refunded:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  resolved:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  low:          'bg-gray-500/20 text-gray-400 border-gray-500/30',
  default:      'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const classes = variantClasses[variant] ?? variantClasses.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  )
}
