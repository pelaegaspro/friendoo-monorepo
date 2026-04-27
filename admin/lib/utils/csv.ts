/**
 * CSV Export Utility
 * Property 1: CSV Export Round Trip
 * For any array of records, exporting to CSV and parsing back should recover equivalent fields.
 */

/** Escape a CSV cell value */
function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Serialize an array of records to a CSV string */
export function toCsvString(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const headerRow = headers.map(escapeCell).join(',')
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(',')
  )
  return [headerRow, ...dataRows].join('\n')
}

/** Parse a CSV string back to an array of records (for round-trip testing) */
export function parseCsvString(csv: string): Record<string, string>[] {
  const lines = csv.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').replace(/""/g, '"'))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"'))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

/** Trigger a browser download of a CSV file */
export function exportToCSV(rows: Record<string, unknown>[], filename: string): void {
  const csv = toCsvString(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
