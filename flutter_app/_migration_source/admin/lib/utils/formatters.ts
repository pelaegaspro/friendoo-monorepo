import { Timestamp } from 'firebase/firestore'
import { format, formatDistanceToNow } from 'date-fns'

/** Convert paise (integer) to ₹X,XXX.XX */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees)
}

/** Format a Firestore Timestamp to a readable date string */
export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  try {
    return format(ts.toDate(), 'dd MMM yyyy, hh:mm a')
  } catch {
    return '—'
  }
}

/** Format a Firestore Timestamp to relative time (e.g. "2 hours ago") */
export function formatRelativeDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—'
  try {
    return formatDistanceToNow(ts.toDate(), { addSuffix: true })
  } catch {
    return '—'
  }
}

/** Format seconds to HH:MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

/** Format minutes to "Xh Ym" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
