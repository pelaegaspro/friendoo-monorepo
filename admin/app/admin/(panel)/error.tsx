'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin Panel error boundary caught error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-red-500/10 p-4 text-red-400">
        <AlertCircle size={36} />
      </div>
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        {error?.message || 'An unexpected error occurred while loading this view.'}
      </p>
      {error?.digest && (
        <p className="mt-1 font-mono text-xs text-zinc-600">Digest: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
      >
        <RotateCcw size={16} />
        <span>Try Again</span>
      </button>
    </div>
  )
}

