import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  icon?: ReactNode
  badge?: string
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = '',
  icon,
}: SectionCardProps) {
  return (
    <section
      className={`glass-card-4k overflow-hidden ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated border border-border text-accent">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {title ? (
                  <h2 className="text-base font-bold text-white tracking-tight sm:text-lg">
                    {title}
                  </h2>
                ) : null}
              </div>
              {description ? (
                <p className="mt-0.5 text-xs text-[#8BA3AB]">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">{actions}</div> : null}
        </div>
      )}

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}
