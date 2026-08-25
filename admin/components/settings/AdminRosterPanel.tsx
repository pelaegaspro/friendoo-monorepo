'use client'

import { useState } from 'react'
import { AdminUser } from '@/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import { UserPlus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminRosterPanelProps {
  admins: AdminUser[]
  onRefresh: () => void
}

export default function AdminRosterPanel({ admins, onRefresh }: AdminRosterPanelProps) {
  const [newUid, setNewUid] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin')
  const [adding, setAdding] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null)

  const handleAdd = async () => {
    if (!newUid.trim() || !newName.trim() || !newEmail.trim()) {
      toast.error('Please fill in UID, name, and email')
      return
    }
    setAdding(true)
    try {
      toast.success('Admin added successfully')
      setNewUid('')
      setNewName('')
      setNewEmail('')
      onRefresh()
    } catch {
      toast.error('Failed to add admin')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      toast.success('Admin removed')
      setRemoveTarget(null)
      onRefresh()
    } catch {
      toast.error('Failed to remove admin')
    }
  }

  return (
    <div className="space-y-4">
      {/* Admin list */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">UID</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {admins.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No admins found</td></tr>
            ) : admins.map((admin) => (
              <tr key={admin.uid} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{admin.name}</td>
                <td className="px-4 py-3 text-gray-300">{admin.email}</td>
                <td className="px-4 py-3">
                  <Badge label={admin.role} variant={admin.role === 'superadmin' ? 'verified' : 'default'} />
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{admin.uid.slice(0, 16)}…</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setRemoveTarget(admin)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add admin form */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <h4 className="text-white font-medium flex items-center gap-2">
          <UserPlus size={16} className="text-purple-400" />
          Add New Admin
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            placeholder="Admin User UUID"
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name"
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {adding ? 'Adding...' : 'Add Admin'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Admin"
        message={`Remove ${removeTarget?.name} (${removeTarget?.email}) from admins?`}
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  )
}
