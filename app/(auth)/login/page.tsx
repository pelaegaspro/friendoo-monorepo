'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { PhoneInput } from '../../../components/auth/PhoneInput';
import { OTPInput } from '../../../components/auth/OTPInput';
import { Button } from '../../../src/components/ui/button';
import { toast } from 'sonner';
import { ConfirmationResult } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setOnboardingComplete } = useAuthStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (phone: string) => {
    setLoading(true);
    try {
      const result = await authService.signInWithPhone(phone, 'recaptcha-container');
      setConfirmationResult(result);
      setPhoneNumber(phone);
      setStep(2);
      toast.success('OTP sent successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    if (!confirmationResult) return;
    setLoading(true);
    try {
      const result = await authService.verifyOTP(confirmationResult, otp);
      await handlePostAuth(result.user.uid);
    } catch (err: any) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      await handlePostAuth(result.user.uid);
    } catch (err: any) {
      toast.error('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuth = async (uid: string) => {
    const isComplete = await authService.isOnboardingComplete(uid);
    setOnboardingComplete(isComplete);
    
    if (isComplete) {
      router.push('/');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black italic tracking-tighter text-purple-600">FRIENDOO</h1>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Find your people.</p>
      </div>

      <div className="w-full max-w-sm space-y-8">
        {step === 1 ? (
          <div className="space-y-6">
            <PhoneInput onSubmit={handleSendOTP} loading={loading} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-zinc-500 font-bold">Or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl border-2 border-zinc-800 font-bold gap-3"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </Button>
          </div>
        ) : (
          <OTPInput 
            phoneNumber={phoneNumber} 
            onVerify={handleVerifyOTP} 
            onResend={() => handleSendOTP(phoneNumber)}
            onBack={() => setStep(1)}
            loading={loading}
          />
        )}
      </div>

      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container" />
    </div>
  );
}
