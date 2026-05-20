import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthContext } from '@/contexts/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Status = 'checking' | 'success' | 'failed' | 'timeout'

export function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshProfile } = useAuthContext()
  const [status, setStatus] = useState<Status>('checking')
  const [coins, setCoins] = useState(0)

  const orderId = searchParams.get('order_id')

  useEffect(() => {
    if (!orderId) {
      setStatus('failed')
      return
    }

    let cancelled = false

    async function pollStatus() {
      // Poll for up to 30 seconds
      for (let i = 0; i < 15; i++) {
        if (cancelled) return

        try {
          // Query the transaction by cashfreeOrderId
          const q = query(
            collection(db, 'coinTransactions'),
            where('cashfreeOrderId', '==', orderId),
            where('status', '==', 'success'),
          )
          const snap = await getDocs(q)

          if (!snap.empty) {
            const txData = snap.docs[0].data()
            setCoins(txData.amountCoins ?? 0)
            setStatus('success')
            await refreshProfile()
            return
          }

          // Check if it failed
          const failQ = query(
            collection(db, 'coinTransactions'),
            where('cashfreeOrderId', '==', orderId),
            where('status', '==', 'failed'),
          )
          const failSnap = await getDocs(failQ)
          if (!failSnap.empty) {
            setStatus('failed')
            return
          }
        } catch (err) {
          console.error('PaymentCallback poll error:', err)
        }

        await new Promise((r) => setTimeout(r, 2000))
      }

      if (!cancelled) setStatus('timeout')
    }

    pollStatus()

    return () => {
      cancelled = true
    }
  }, [orderId, refreshProfile])

  // Auto-redirect to wallet after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/wallet', { replace: true }), 3000)
      return () => clearTimeout(timer)
    }
  }, [status, navigate])

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {status === 'checking' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#7c5cff] animate-spin" />
            <p className="text-white/70 text-sm">Confirming your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={48} className="text-green-400" />
            <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
            <p className="text-white/60 text-sm">{coins} coins have been added to your wallet.</p>
            <p className="text-white/40 text-xs">Redirecting to wallet...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={48} className="text-red-400" />
            <h2 className="text-xl font-bold text-white">Payment Failed</h2>
            <p className="text-white/60 text-sm">The payment could not be completed. Please try again.</p>
            <button
              onClick={() => navigate('/wallet', { replace: true })}
              className="mt-4 px-6 py-2.5 bg-[#7c5cff] text-white rounded-xl text-sm font-semibold hover:bg-[#6a4ae8] transition"
            >
              Back to Wallet
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Processing Payment</h2>
            <p className="text-white/60 text-sm">
              Your payment is being processed. Coins will be credited shortly.
            </p>
            <button
              onClick={() => navigate('/wallet', { replace: true })}
              className="mt-4 px-6 py-2.5 bg-[#7c5cff] text-white rounded-xl text-sm font-semibold hover:bg-[#6a4ae8] transition"
            >
              Back to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
