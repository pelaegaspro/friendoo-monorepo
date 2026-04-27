import { Host } from '@/types'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { Star } from 'lucide-react'

interface HostProfileModalProps {
  host: Host | null
  isOpen: boolean
  onClose: () => void
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function HostProfileModal({ host, isOpen, onClose }: HostProfileModalProps) {
  if (!host) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Host Profile" size="md">
      <div className="space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          {host.photoURL ? (
            <img src={host.photoURL} alt={host.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {getInitials(host.name)}
            </div>
          )}
          <div>
            <h3 className="text-white text-lg font-semibold">{host.name}</h3>
            <Badge label={host.status} variant={host.status} />
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Phone</p>
            <p className="text-white">{host.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="text-white">{host.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Category</p>
            <p className="text-white">{host.category || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Languages</p>
            <p className="text-white">
              {host.languages?.length ? host.languages.join(', ') : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= Math.round(host.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                />
              ))}
              <span className="text-white ml-1">{host.rating?.toFixed(1) ?? '—'}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Earnings</p>
            <p className="text-white">{formatCurrency(host.totalEarnings ?? 0)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Join Date</p>
            <p className="text-white">{formatDate(host.createdAt)}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
