'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { CheckCircle2, ChevronLeft, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/authStore';
import { useProfile } from '../../../hooks/useProfile';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';

const languageOptions = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Gujarati',
];

function getFirebase() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  return { app, auth, db, storage };
}

type Step = 1 | 2 | 3;

export default function ApplyHostPage() {
  const router = useRouter();
  const currentUid = useAuthStore((state) => state.user?.uid);
  const { profile, isLoading } = useProfile(currentUid || '');

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [lifestyleFiles, setLifestyleFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    age: 18,
    city: '',
    languages: [] as string[],
    agreeGuidelines: false,
    agreeAge: false,
  });

  useEffect(() => {
    if (!profile) return;
    setFormData((current) => ({
      ...current,
      name: current.name || profile.displayName || '',
      age: profile.age || current.age,
      city: current.city || profile.city || '',
      languages: current.languages.length ? current.languages : profile.languages || [],
    }));
  }, [profile]);

  const applicationState = useMemo(() => {
    if (profile?.isHost && profile?.hostStatus === 'approved') return 'approved';
    if (profile?.hostStatus === 'pending') return 'pending';
    return 'new';
  }, [profile?.hostStatus, profile?.isHost]);

  const toggleLanguage = (language: string) => {
    setFormData((current) => {
      const exists = current.languages.includes(language);
      return {
        ...current,
        languages: exists
          ? current.languages.filter((item) => item !== language)
          : [...current.languages, language],
      };
    });
  };

  const uploadFiles = async () => {
    const { storage } = getFirebase();
    const files = [selfieFile, ...lifestyleFiles].filter((file): file is File => Boolean(file));
    const uploaded: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const kind = index === 0 ? 'selfie' : `lifestyle-${index}`;
      const path = `hostApplications/${currentUid}/${kind}-${Date.now()}-${file.name}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      uploaded.push(await getDownloadURL(fileRef));
    }

    return uploaded;
  };

  const submit = async () => {
    if (!currentUid || !profile) return;
    if (!formData.name.trim() || !formData.city.trim() || !formData.languages.length) {
      toast.error('Please complete all fields before continuing');
      return;
    }
    if (!selfieFile) {
      toast.error('Please upload one clear selfie');
      return;
    }
    if (!formData.agreeGuidelines || !formData.agreeAge) {
      toast.error('Please accept the host agreements');
      return;
    }

    setIsSubmitting(true);
    try {
      const { auth, db } = getFirebase();
      const uploadedPhotos = await uploadFiles();

      await addDoc(collection(db, 'hostApplications'), {
        userId: currentUid,
        name: formData.name.trim(),
        phone: auth.currentUser?.phoneNumber || profile.phoneNumber || profile.phone || '',
        age: formData.age,
        city: formData.city.trim(),
        languages: formData.languages,
        photos: uploadedPhotos,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', currentUid), {
        hostStatus: 'pending',
        updatedAt: serverTimestamp(),
      });

      setIsSuccess(true);
      toast.success('Application submitted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLifestyleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 2);
    setLifestyleFiles(files);
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-center text-white">
        <div className="space-y-5 rounded-[32px] border border-purple-500/20 bg-zinc-950/90 p-8 shadow-2xl shadow-purple-950/30">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-600/20 text-purple-300">
            <CheckCircle2 className="h-12 w-12 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Application submitted!</h1>
            <p className="text-sm text-zinc-400">
              Our team will review and contact you within 24 hours.
            </p>
          </div>
          <Button onClick={() => router.push('/discover')} className="w-full rounded-2xl bg-purple-600 hover:bg-purple-700">
            Go to Home
          </Button>
        </div>
      </main>
    );
  }

  if (applicationState === 'pending') {
    return (
      <main className="min-h-dvh bg-background px-6 py-10 text-white">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-zinc-400">
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <div className="rounded-[28px] border border-purple-500/20 bg-zinc-900/70 p-6 text-center">
          <h1 className="text-xl font-black">Your application is under review</h1>
          <p className="mt-3 text-sm text-zinc-400">
            We&apos;ll notify you soon once the Friendoo team completes the review.
          </p>
        </div>
      </main>
    );
  }

  if (applicationState === 'approved') {
    return (
      <main className="min-h-dvh bg-background px-6 py-10 text-white">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-zinc-400">
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <div className="rounded-[28px] border border-emerald-500/20 bg-zinc-900/70 p-6 text-center">
          <h1 className="text-xl font-black">You&apos;re a verified host! ✅</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Your host account is active and ready to earn.
          </p>
          <Link
            href="/earnings"
            className="mt-5 inline-flex rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
          >
            Go to Earnings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background px-6 pb-24 pt-8 text-white">
      <div className="mx-auto max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-full bg-zinc-900 p-2 text-zinc-300">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Earn with Friendoo</p>
            <h1 className="text-2xl font-black">Become a host</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className={`h-2 flex-1 rounded-full ${
                value <= step ? 'bg-purple-600' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-5 rounded-[28px] border border-zinc-800 bg-zinc-900/60 p-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-300">Full name</span>
              <Input
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                className="h-12 rounded-2xl border-zinc-800 bg-zinc-950"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-300">Age</span>
                <Input
                  type="number"
                  min={18}
                  value={formData.age}
                  onChange={(event) => setFormData((current) => ({ ...current, age: Number(event.target.value) }))}
                  className="h-12 rounded-2xl border-zinc-800 bg-zinc-950"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-300">City</span>
                <Input
                  value={formData.city}
                  onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                  className="h-12 rounded-2xl border-zinc-800 bg-zinc-950"
                />
              </label>
            </div>
            <div className="space-y-3">
              <span className="text-sm font-semibold text-zinc-300">Languages you speak</span>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => toggleLanguage(language)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      formData.languages.includes(language)
                        ? 'border-purple-500 bg-purple-600 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="h-12 w-full rounded-2xl bg-purple-600 hover:bg-purple-700">
              Continue
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5 rounded-[28px] border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-300">Upload a clear selfie</p>
              <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-950 text-center text-zinc-400">
                <UploadCloud className="mb-3 h-7 w-7 text-purple-400" />
                <span className="text-sm font-medium">{selfieFile ? selfieFile.name : 'Choose selfie'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setSelfieFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-300">Upload lifestyle photos (optional)</p>
              <label className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-950 text-center text-zinc-400">
                <UploadCloud className="mb-3 h-7 w-7 text-purple-400" />
                <span className="text-sm font-medium">
                  {lifestyleFiles.length ? `${lifestyleFiles.length} file(s) selected` : 'Choose lifestyle photos'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onLifestyleChange}
                />
              </label>
            </div>
            <p className="rounded-2xl border border-purple-500/10 bg-purple-600/10 p-4 text-sm text-zinc-300">
              Your photos will be reviewed by our team within 24 hours.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="h-12 rounded-2xl border-zinc-800 bg-zinc-950">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="h-12 rounded-2xl bg-purple-600 hover:bg-purple-700">
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5 rounded-[28px] border border-zinc-800 bg-zinc-900/60 p-5">
            <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={formData.agreeGuidelines}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, agreeGuidelines: event.target.checked }))
                }
                className="mt-1 h-4 w-4 accent-purple-600"
              />
              <span>I agree to Friendoo Host Guidelines</span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={formData.agreeAge}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, agreeAge: event.target.checked }))
                }
                className="mt-1 h-4 w-4 accent-purple-600"
              />
              <span>I am above 18 years of age</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="h-12 rounded-2xl border-zinc-800 bg-zinc-950">
                Back
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
