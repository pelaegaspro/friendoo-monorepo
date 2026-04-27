import { Booking } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

interface Props { bookings: Booking[] }

export default function RecentBookingsTable({ bookings }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">Recent Bookings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Host</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {bookings.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No bookings yet</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-gray-300">{b.userName}</td>
                <td className="px-4 py-3 text-gray-300">{b.hostName}</td>
                <td className="px-4 py-3 text-gray-300">{formatCurrency(b.amount)}</td>
                <td className="px-4 py-3">
                  <Badge label={b.status} variant={b.status as 'active' | 'completed' | 'cancelled' | 'pending'} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
