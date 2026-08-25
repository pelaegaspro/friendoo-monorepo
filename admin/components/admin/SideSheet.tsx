'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface SideSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  widthClassName?: string
}

export default function SideSheet({
  open,
  onClose,
  title,
  description,
  children,
  widthClassName = 'max-w-xl',
}: SideSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className={`absolute right-0 top-0 h-full w-full ${widthClassName} border-l border-[#2b2b2b] bg-[#121212] shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-[#2b2b2b] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#313131] p-2 text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-89px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
