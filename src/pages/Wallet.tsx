import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { CoinPackModal } from '@/components/CoinPackModal'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCoinBalance } from '@/hooks/useCoinBalance'
import { Coins, Plus, TrendingDown, TrendingUp } from 'lucide-react'

export function Wallet() {
  const { user, profile } = useAuthContext()
  const balance = useCoinBalance(user?.uid)
  const [showBuy, setShowBuy] = useState(false)

  return (
    <>
      <Layout title="Wallet">
        <div className="px-4 pt-6 pb-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#7c5cff]/30 via-[#7c5cff]/15 to-[#ff7ab6]/20 border border-[#7c5cff]/30 p-6 text-center">
            <Coins size={32} className="text-yellow-400 mx-auto mb-3" />
            <p className="text-white/50 text-sm mb-1">Available coins</p>
            <p className="text-5xl font-extrabold tracking-tight">{balance.toLocaleString('en-IN')}</p>
            <p className="text-white/30 text-xs mt-1">1 coin ≈ ₹1</p>
            <button
              onClick={() => setShowBuy(true)}
              className="mt-5 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-[#7c5cff] font-bold text-sm transition hover:bg-[#9375ff]"
            >
              <Plus size={16} />
              Buy Coins
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.05] border border-white/[0.07] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Total topped-up</p>
                <p className="font-bold text-sm mt-0.5">—</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.05] border border-white/[0.07] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <TrendingDown size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Total spent</p>
                <p className="font-bold text-sm mt-0.5">
                  {profile?.totalSpent?.toLocaleString('en-IN') ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-white/50 mb-3">How coins work</h2>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] divide-y divide-white/[0.06]">
              {[
                ['Normal Host call', '5 coins / min'],
                ['Star Host call', '10 coins / min (offer: 7)'],
                ['Minimum balance to call', '30 coins'],
                ['Welcome bonus', '50 free coins'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-white/60">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>

      {showBuy && <CoinPackModal onClose={() => setShowBuy(false)} />}
    </>
  )
}
