import { useEffect, useState } from 'react'
import { X, Coins } from 'lucide-react'
import { listActiveCoinPacks, createPaymentOrder, verifyAndRechargeWallet, coinsForPack } from '@/lib/coinService'
import { useAuthContext } from '@/contexts/AuthContext'
import type { CoinPack } from '@/types'
import toast from 'react-hot-toast'

interface CoinPackModalProps {
  onClose: () => void
}

export function CoinPackModal({ onClose }: CoinPackModalProps) {
  const { user, refreshProfile } = useAuthContext()
  const [packs, setPacks] = useState<CoinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    listActiveCoinPacks().then(setPacks).finally(() => setLoading(false))
  }, [])

  async function handleBuy(pack: CoinPack) {
    if (!user) return
    setBuying(pack.id)
    try {
      const { orderId, paymentSessionId } = await createPaymentOrder(pack.priceInr)

      if (typeof window.Cashfree === 'undefined') {
        toast.error('Payment gateway not loaded')
        return
      }

      const cashfree = window.Cashfree({ mode: 'sandbox' })
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      })

      const result = await verifyAndRechargeWallet(user.uid, orderId)
      if (result.success) {
        toast.success(`+${result.coinsAdded} coins added!`)
        await refreshProfile()
        onClose()
      } else {
        toast.error('Payment not verified. Contact support.')
      }
    } catch (err) {
      console.error('Payment error', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0d0f1a] border border-white/[0.09] rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Buy Coins</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#7c5cff]/40 border-t-[#7c5cff] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packs.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack)}
                disabled={buying === pack.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-left transition hover:bg-white/[0.09] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7c5cff]/20 flex items-center justify-center">
                    <Coins size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{pack.displayName}</p>
                    <p className="text-white/45 text-xs">
                      {coinsForPack(pack)} coins
                      {pack.bonus > 0 && (
                        <span className="ml-1.5 text-green-400">+{pack.bonus} bonus</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base">₹{pack.priceInr}</p>
                  {buying === pack.id && (
                    <p className="text-xs text-white/40 mt-0.5">Processing…</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    Cashfree: (opts: { mode: string }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => Promise<void>
    }
  }
}
