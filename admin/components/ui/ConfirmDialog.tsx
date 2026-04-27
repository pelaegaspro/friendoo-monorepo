'use client'

import { useState } from 'react'
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  requireReason?: boolean
  reasonPlaceholder?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Enter reason...',
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined)
    setReason('')
    onClose()
  }

  const btnClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-300 mb-4">{message}</p>
      {requireReason && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={reasonPlaceholder}
          rows={3}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:outline-none focus:border-purple-500"
        />
      )}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={requireReason && !reason.trim()}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${btnClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
