import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { M3Button } from '@/components/m3/M3Button';
import { M3Card, M3CardHeader, M3CardTitle, M3CardDescription, M3CardContent, M3CardFooter } from '@/components/m3/M3Card';
import { M3TextField, M3TextArea } from '@/components/m3/M3TextField';
import { M3Chip } from '@/components/m3/M3Chip';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { toast } from 'sonner';
import { handleAppError } from '@/lib/error-handler';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { onboardingProfileSchema, buildUserDocument, type OnboardingProfileInput } from '@/schemas/user';
import type { Gender } from '@/types';
import '@/styles/m3-theme.css';

const INTEREST_OPTIONS = ['Cricket', 'Baking', 'Coding', 'Anime', 'Travel', 'Music', 'Gaming', 'Fitness', 'Art', 'Tech'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Malayalam', 'Urdu', 'Punjabi'];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function Onboarding() {
  const { firebaseUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [formData, setFormData] = useState({
    username: '',
    city: '',
    gender: 'prefer-not-to-say' as Gender,
    age: 18,
    interests: [] as string[],
    languages: [] as string[],
    bio: '',
    friendshipIntent: '',
    preferredChatModes: ['text'] as ('text' | 'voice')[],
    guidelinesAccepted: false,
  });

  const { isAvailable, checking } = useUsernameCheck(formData.username);

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
    }));
  };

  const toggleChatMode = (mode: 'text' | 'voice') => {
    setFormData((prev) => {
      const has = prev.preferredChatModes.includes(mode);
      const next = has ? prev.preferredChatModes.filter((m) => m !== mode) : [...prev.preferredChatModes, mode];
      return { ...prev, preferredChatModes: next.length ? next : ['text'] };
    });
  };

  const persistPartial = async (nextStep: number) => {
    if (!firebaseUser) return;
    try {
      await setDoc(
        doc(db, 'onboardingProfiles', firebaseUser.uid),
        {
          step: nextStep,
          updatedAt: new Date().toISOString(),
          partial: {
            username: formData.username,
            city: formData.city,
            gender: formData.gender,
            age: formData.age,
            interests: formData.interests,
            languages: formData.languages,
            bio: formData.bio,
            friendshipIntent: formData.friendshipIntent,
            preferredChatModes: formData.preferredChatModes,
          },
        },
        { merge: true },
      );
    } catch (err) {
      console.warn('Onboarding autosave failed', err);
    }
  };

  const handleComplete = async () => {
    if (!firebaseUser || isAvailable === false) return;

    const payload: OnboardingProfileInput = {
      username: formData.username,
      city: formData.city,
      bio: formData.bio,
      interests: formData.interests,
      languages: formData.languages.length ? formData.languages : ['English'],
      gender: formData.gender,
      age: formData.age,
      friendshipIntent: formData.friendshipIntent,
      preferredChatModes: formData.preferredChatModes as ('text' | 'voice')[],
      guidelinesAccepted: formData.guidelinesAccepted,
    };

    const parsed = onboardingProfileSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Check your answers';
      toast.error(first);
      return;
    }

    try {
      const userDoc = buildUserDocument(parsed.data, {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || parsed.data.username,
        photoURL: firebaseUser.photoURL || '',
      });
      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);
      await setDoc(
        doc(db, 'onboardingProfiles', firebaseUser.uid),
        { completedAt: new Date().toISOString(), step: totalSteps },
        { merge: true },
      );
      toast.success('Welcome to Friendoo!');
      navigate('/');
    } catch (err: unknown) {
      handleAppError(err, 'Onboarding profile creation');
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <div className="mb-8 flex justify-between items-center text-sm font-medium text-[var(--text-secondary)]">
        <span className="sentence-case">
          Step {step} of {totalSteps}
        </span>
        <div className="w-1/2 h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--md-sys-color-primary)] transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Basics</M3CardTitle>
            <M3CardDescription>Handle and city help nearby discovery.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent className="space-y-4">
            <div>
              <M3TextField
                label="Username"
                placeholder="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  }))
                }
                fullWidth
                className={isAvailable === false ? 'border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]' : ''}
              />
              <div className="flex items-center gap-2 mt-2">
                {checking && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />}
                {!checking && isAvailable === true && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                {!checking && isAvailable === false && <XCircle className="w-4 h-4 text-[var(--md-sys-color-error)]" />}
                {isAvailable === false && (
                  <p className="text-xs text-[var(--md-sys-color-error)] font-bold uppercase tracking-tight sentence-case">Username already taken</p>
                )}
              </div>
            </div>
            <M3TextField
              label="City"
              placeholder="Where are you based?"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[var(--text-primary)] mb-2 block sentence-case">Gender</label>
                <select
                  className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  value={formData.gender}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as Gender }))}
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <M3TextField
                label="Age"
                type="number"
                min={13}
                max={120}
                value={formData.age}
                onChange={(e) => setFormData((prev) => ({ ...prev, age: Number(e.target.value) || 13 }))}
                fullWidth
              />
            </div>
          </M3CardContent>
          <M3CardFooter>
            <M3Button
              disabled={!formData.username || !formData.city || isAvailable !== true}
              onClick={async () => {
                await persistPartial(2);
                setStep(2);
              }}
              className="w-full"
            >
              Next
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}

      {step === 2 && (
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Interests</M3CardTitle>
            <M3CardDescription>Pick a few — we use these for friend suggestions.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((i) => (
                <M3Chip
                  key={i}
                  selected={formData.interests.includes(i)}
                  onClick={() => toggleInterest(i)}
                  variant={formData.interests.includes(i) ? 'filled' : 'outlined'}
                >
                  {i}
                </M3Chip>
              ))}
            </div>
          </M3CardContent>
          <M3CardFooter className="flex-col gap-2">
            <M3Button
              disabled={formData.interests.length === 0}
              onClick={async () => {
                await persistPartial(3);
                setStep(3);
              }}
              className="w-full"
            >
              Next
            </M3Button>
            <M3Button variant="text" onClick={() => setStep(1)} className="w-full">
              Back
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}

      {step === 3 && (
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Languages & bio</M3CardTitle>
            <M3CardDescription>Multilingual matching is core to Friendoo.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <M3Chip
                  key={lang}
                  selected={formData.languages.includes(lang)}
                  onClick={() => toggleLanguage(lang)}
                  variant={formData.languages.includes(lang) ? 'filled' : 'outlined'}
                >
                  {lang}
                </M3Chip>
              ))}
            </div>
            <M3TextField
              label="What kind of friends do you want?"
              placeholder="Study buddies, gym partners, city explorers…"
              value={formData.friendshipIntent}
              onChange={(e) => setFormData((prev) => ({ ...prev, friendshipIntent: e.target.value }))}
              fullWidth
            />
            <div>
              <label className="text-sm font-semibold text-[var(--text-primary)] mb-2 block sentence-case">Chat preference</label>
              <div className="flex gap-2">
                {(['text', 'voice'] as const).map((mode) => (
                  <M3Chip
                    key={mode}
                    selected={formData.preferredChatModes.includes(mode)}
                    onClick={() => toggleChatMode(mode)}
                    variant={formData.preferredChatModes.includes(mode) ? 'filled' : 'outlined'}
                  >
                    {mode}
                  </M3Chip>
                ))}
              </div>
            </div>
            <M3TextArea
              placeholder="Short bio — what makes you a good friend?"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              fullWidth
              rows={3}
            />
          </M3CardContent>
          <M3CardFooter className="flex-col gap-2">
            <M3Button
              onClick={async () => {
                await persistPartial(4);
                setStep(4);
              }}
              className="w-full"
            >
              Next
            </M3Button>
            <M3Button variant="text" onClick={() => setStep(2)} className="w-full">
              Back
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}

      {step === 4 && (
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Comfort & safety</M3CardTitle>
            <M3CardDescription>Quick preferences — you can change these later in settings.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
            <p className="sentence-case">
              Friendoo is friendship-first. You control who can connect with you, and you can block or report anyone who
              breaks community guidelines.
            </p>
            <p className="text-xs sentence-case">
              Women's safety controls (discover visibility, incoming requests) will appear in Settings as we roll out city
              by city.
            </p>
          </M3CardContent>
          <M3CardFooter className="flex-col gap-2">
            <M3Button
              onClick={async () => {
                await persistPartial(5);
                setStep(5);
              }}
              className="w-full"
            >
              Next
            </M3Button>
            <M3Button variant="text" onClick={() => setStep(3)} className="w-full">
              Back
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}

      {step === 5 && (
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Community guidelines</M3CardTitle>
            <M3CardDescription>Be kind, be honest, keep it platonic.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent className="space-y-4">
            <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-2">
              <li className="sentence-case">No harassment, hate, or explicit sexual advances.</li>
              <li className="sentence-case">Do not share financial scams or illegal content.</li>
              <li className="sentence-case">Respect boundaries — no means no.</li>
            </ul>
            <label className="flex items-start gap-3 text-sm font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-[var(--border-primary)] accent-[var(--md-sys-color-primary)]"
                checked={formData.guidelinesAccepted}
                onChange={(e) => setFormData((prev) => ({ ...prev, guidelinesAccepted: e.target.checked }))}
              />
              <span className="sentence-case">I agree to the Community Guidelines and understand Friendoo is not a dating app.</span>
            </label>
          </M3CardContent>
          <M3CardFooter className="flex-col gap-2">
            <M3Button onClick={handleComplete} className="w-full text-lg font-bold">
              Launch Friendoo
            </M3Button>
            <M3Button variant="text" onClick={() => setStep(4)} className="w-full">
              Back
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}
    </div>
  );
}
