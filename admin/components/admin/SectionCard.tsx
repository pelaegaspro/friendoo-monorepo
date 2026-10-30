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
  badge,
}: SectionCardProps) {
  return (
    <section
      className={`glass-card-4k ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-[#071821]/40 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#09222B]/80 border border-[#60CECA]/25 text-[#60CECA] shadow-[0_0_12px_rgba(96,206,202,0.15)]">
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
                {badge && (
                  <span className="rounded-full bg-[#60CECA]/15 border border-[#60CECA]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#60CECA] tracking-wide uppercase">
                    {badge}
                  </span>
                )}
              </div>
              {description ? (
                <p className="mt-0.5 text-xs text-[#8BA3AB]">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">{actions}</div> : null}
        </div>
      )}

      <div className="p-6">{children}</div>
    </section>
  )
}
