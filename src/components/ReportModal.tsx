import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthContext } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const REASONS = [
  'Harassment',
  'Inappropriate content',
  'Off-Platform Fraud',
  'Fake profile',
  'Spam',
  'Other',
]

interface ReportModalProps {
  reportedId: string
  reportedAlias: string
  onClose: () => void
}

export function ReportModal({ reportedId, reportedAlias, onClose }: ReportModalProps) {
  const { user } = useAuthContext()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!reason) { toast.error('Select a reason'); return }
    if (!user) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reportedId,
        reportedAlias,
        reason,
        details,
        status: 'open',
        evidenceUrl: null,
        amountLost: 0,
        createdAt: serverTimestamp(),
      })
      toast.success("Report submitted. We'll review it within 24 hours.")
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0d0f1a] border border-white/[0.09] rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-base font-bold">Report {reportedAlias}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition text-left ${
                  reason === r
                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-[#7c5cff]/60"
          />

          <button
            onClick={submit}
            disabled={submitting || !reason}
            className="w-full py-3 rounded-xl bg-red-500 font-semibold text-sm transition hover:bg-red-400 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
