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
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#121420]/75 backdrop-blur-xl shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Top subtle highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300">
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
                  <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                    {badge}
                  </span>
                )}
              </div>
              {description ? (
                <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
          ) : null}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  )
}
