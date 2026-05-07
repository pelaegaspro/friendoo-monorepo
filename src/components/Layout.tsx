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
          <h1 className="text-base font-bold tracking-tight">{title}</h1>
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
