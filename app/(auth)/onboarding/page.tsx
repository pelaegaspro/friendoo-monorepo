'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { StepIndicator } from '../../../components/onboarding/StepIndicator';
import { OnboardingStep } from '../../../components/onboarding/OnboardingStep';
import { Button } from '../../../src/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setOnboardingComplete } = useAuthStore();
  const userId = user?.uid;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    displayName: '',
    age: 18,
    gender: '',
    city: '',
    languages: [],
    interests: [],
    friendPreference: '',
    connectType: '',
    photoURL: '',
    aiAvatarId: '',
    safety: {
      requests: 'Everyone',
      calls: 'Friends only',
      anonymous: false,
    }
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    const fetchProgress = async () => {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };
      const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      try {
        const snap = await getDoc(doc(db, 'onboardingProfiles', userId));
        if (snap.exists()) {
          setFormData(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Failed to fetch progress', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  const saveProgress = async (data: any) => {
    if (!userId) return;
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    };
    const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await setDoc(doc(db, 'onboardingProfiles', userId), data, { merge: true });
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      await saveProgress(formData);
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };
      const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      const finalData = {
        ...formData,
        onboardingComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        friendCount: 0,
        conversationCount: 0,
        trustScore: 100,
        onlineStatus: true,
        lastSeen: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userId), finalData);
      setOnboardingComplete(true);
      toast.success('Welcome to Friendoo!');
      router.push('/');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden max-w-md mx-auto border-x border-zinc-900">
      <header className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(s => s - 1)} 
              className="p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex-1">
            <StepIndicator current={currentStep} total={TOTAL_STEPS} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 scrollbar-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <OnboardingStep 
              step={currentStep} 
              data={formData} 
              updateData={(newData) => setFormData({...formData, ...newData})} 
            />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-6 border-t border-zinc-900 bg-background/80 backdrop-blur-md">
        <Button 
          onClick={handleNext} 
          disabled={isSaving}
          className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-lg font-black shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
        >
          {isSaving ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            currentStep === TOTAL_STEPS ? 'GET STARTED' : 'CONTINUE'
          )}
        </Button>
      </footer>
    </div>
  );
}
