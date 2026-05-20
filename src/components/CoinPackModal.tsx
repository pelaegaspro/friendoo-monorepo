import { useEffect, useState } from 'react'
import { X, Coins } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { listActiveCoinPacks, createPaymentOrder, coinsForPack } from '@/lib/coinService'
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
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    listActiveCoinPacks().then(setPacks).finally(() => setLoading(false))
  }, [])

  async function handleBuy(pack: CoinPack) {
    if (!user) return
    setBuying(pack.id)
    try {
      const { paymentSessionId, coins } = await createPaymentOrder(pack.id)

      if (typeof window.Cashfree === 'undefined') {
        toast.error('Payment gateway not loaded')
        return
      }

      const env = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
      const cashfree = window.Cashfree({ mode: env })
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      })

      // Payment submitted — webhook will credit coins async
      setConfirming(true)
      toast.loading('Confirming payment...', { id: 'payment-confirm' })

      // Read balance before payment directly from Firestore
      const userRef = doc(db, 'users', user.uid)
      const balanceBefore = (await getDoc(userRef)).data()?.coinBalance ?? 0

      // Poll for balance update (webhook credits within seconds)
      let confirmed = false
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000))
        await refreshProfile()
        const currentBalance = (await getDoc(userRef)).data()?.coinBalance ?? 0
        if (currentBalance > balanceBefore) {
          confirmed = true
          break
        }
      }

      toast.dismiss('payment-confirm')
      if (confirmed) {
        toast.success(`+${coins} coins added!`)
      } else {
        toast('Payment is being processed. Coins will be credited shortly.')
      }
      onClose()
    } catch (err) {
      console.error('Payment error', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setBuying(null)
      setConfirming(false)
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
        ) : confirming ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-10 h-10 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" />
            <p className="text-sm text-white/60">Confirming your payment...</p>
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
