'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../src/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

interface OTPInputProps {
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => void;
  onBack: () => void;
  loading: boolean;
}

export function OTPInput({ phoneNumber, onVerify, onResend, onBack, loading }: OTPInputProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" /> Change Number
        </button>
        <h2 className="text-3xl font-black italic text-white tracking-tight">VERIFY OTP</h2>
        <p className="text-sm text-zinc-500 font-medium">Sent to <span className="text-zinc-300">{phoneNumber}</span></p>
      </div>

      <div className="flex justify-between gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="tel"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-16 text-center text-2xl font-black bg-zinc-900 rounded-2xl border-2 border-zinc-800 focus:border-purple-500 focus:bg-zinc-800/50 outline-none transition-all text-white"
            disabled={loading}
          />
        ))}
      </div>

      <div className="space-y-6">
        <Button 
          onClick={() => onVerify(otp.join(''))}
          disabled={otp.some(d => d === '') || loading}
          className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-lg font-black shadow-lg shadow-purple-500/20"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFY & CONTINUE'}
        </Button>

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Resend in <span className="text-purple-400">{timer}s</span>
            </p>
          ) : (
            <button 
              onClick={() => {
                setTimer(60);
                onResend();
              }} 
              className="text-xs font-black text-purple-400 hover:underline uppercase tracking-widest"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
