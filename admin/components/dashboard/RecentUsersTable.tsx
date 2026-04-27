import { AppUser } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatters'

interface Props { users: AppUser[] }

export default function RecentUsersTable({ users }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">New Registrations</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No users yet</td></tr>
            ) : users.map((u) => (
              <tr key={u.uid} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 text-xs font-bold">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-gray-300">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{u.phone}</td>
                <td className="px-4 py-3">
                  <Badge label={u.status} variant={u.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
