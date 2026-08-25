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

function parseDateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  const d = new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Format a date to a readable date string */
export function formatDate(ts: unknown): string {
  const date = parseDateValue(ts)
  if (!date) return '—'
  try {
    return format(date, 'dd MMM yyyy, hh:mm a')
  } catch {
    return '—'
  }
}

/** Format a date to relative time (e.g. "2 hours ago") */
export function formatRelativeDate(ts: unknown): string {
  const date = parseDateValue(ts)
  if (!date) return '—'
  try {
    return formatDistanceToNow(date, { addSuffix: true })
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
