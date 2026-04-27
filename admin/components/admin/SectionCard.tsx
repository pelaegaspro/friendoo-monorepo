import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-[#2b2b2b] bg-[#1a1a1a] ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 border-b border-[#2b2b2b] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}
