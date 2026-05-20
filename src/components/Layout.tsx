import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useCoinBalance } from '@/hooks/useCoinBalance'
import { useAuthContext } from '@/contexts/AuthContext'
import { Coins } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  title?: string
  hideNav?: boolean
}

export function Layout({ children, title, hideNav }: LayoutProps) {
  const { user } = useAuthContext()
  const balance = useCoinBalance(user?.uid)

  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col">
      {title && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-[#060810]/95 backdrop-blur border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto select-none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#ff7ab6" />
                </linearGradient>
              </defs>
              <text x="0" y="22" fill="url(#logoGrad)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
            </svg>
            <h1 className="text-base font-bold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] px-3 py-1.5">
            <Coins size={14} className="text-yellow-400" />
            <span className="text-sm font-bold">{balance.toLocaleString('en-IN')}</span>
          </div>
        </header>
      )}
      <main className={`flex-1 ${!hideNav ? 'pb-20' : ''}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
