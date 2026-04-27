import { AppUser } from '@/types'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatDate, formatRelativeDate } from '@/lib/utils/formatters'

interface UserProfileModalProps {
  user: AppUser | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: string, uid: string) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function UserProfileModal({ user, isOpen, onClose, onAction }: UserProfileModalProps) {
  if (!user) return null

  const handleAction = (action: string) => {
    onAction(action, user.uid)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="lg">
      <div className="space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-600">
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-semibold">{user.name}</h3>
              {user.isVerified && <Badge label="Verified" variant="verified" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge label={user.role} variant="default" />
              <Badge label={user.status} variant={user.status} />
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Phone</p>
            <p className="text-white">{user.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Email</p>
            <p className="text-white">{user.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Joined</p>
            <p className="text-white">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Last Active</p>
            <p className="text-white">{formatRelativeDate(user.lastActive)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Coins</p>
            <p className="text-white">{user.coins ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">UID</p>
            <p className="text-gray-400 text-xs font-mono truncate">{user.uid}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-700 pt-4 flex flex-wrap gap-2">
          {!user.isVerified && (
            <button
              onClick={() => handleAction('verify')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Verify User
            </button>
          )}
          {user.status !== 'banned' && (
            <button
              onClick={() => handleAction('ban')}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              Ban User
            </button>
          )}
          {user.status !== 'suspended' && (
            <button
              onClick={() => handleAction('suspend')}
              className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-colors"
            >
              Suspend User
            </button>
          )}
          <button
            onClick={() => handleAction('delete')}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>
    </Modal>
  )
}
