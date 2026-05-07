import { useEffect, useRef, useState } from 'react'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

type Step = 'phone' | 'otp'

export function Login() {
  const { user, sendOtp, confirmOtp } = useAuthContext()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const confirmRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    })
    return () => {
      recaptchaRef.current?.clear()
    }
  }, [])

  async function handleSendOtp() {
    if (!phone.match(/^\+91\d{10}$/)) {
      toast.error('Enter a valid Indian phone number (+91XXXXXXXXXX)')
      return
    }
    if (!recaptchaRef.current) return
    setLoading(true)
    try {
      confirmRef.current = await sendOtp(phone, recaptchaRef.current)
      setStep('otp')
      toast.success('OTP sent!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmOtp() {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    if (!confirmRef.current) return
    setLoading(true)
    try {
      await confirmOtp(confirmRef.current, otp)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center px-6">
      <div id="recaptcha-container" />

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#ff7ab6] flex items-center justify-center text-2xl font-black mb-4">
            F
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Friendoo</h1>
          <p className="text-white/40 text-sm mt-1 text-center">
            Connect with verified female hosts
          </p>
        </div>

        {step === 'phone' ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/50 mb-2 block">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5 text-white text-base outline-none focus:border-[#7c5cff]/70 placeholder-white/25"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#7c5cff] font-bold text-base transition hover:bg-[#9375ff] disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-white/50 text-sm text-center">
              Enter the 6-digit code sent to <span className="text-white font-semibold">{phone}</span>
            </p>
            <input
              type="number"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              placeholder="000000"
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5 text-white text-2xl text-center tracking-[0.5em] outline-none focus:border-[#7c5cff]/70 placeholder-white/25"
            />
            <button
              onClick={handleConfirmOtp}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#7c5cff] font-bold text-base transition hover:bg-[#9375ff] disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="text-white/40 text-sm text-center transition hover:text-white/70"
            >
              Change number
            </button>
          </div>
        )}

        <p className="text-white/20 text-xs text-center mt-8">
          By continuing you agree to our{' '}
          <a href="/terms" className="underline hover:text-white/50">Terms</a> and{' '}
          <a href="/privacy" className="underline hover:text-white/50">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
