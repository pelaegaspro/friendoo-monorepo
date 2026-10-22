'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  HeartHandshake, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Languages, 
  FileText,
  BadgeCheck
} from 'lucide-react';

const languageOptions = [
  'Tamil',
  'Telugu',
  'Hindi',
  'Malayalam',
  'Kannada',
  'Marathi',
  'Bengali',
  'English',
  'Punjabi',
  'Gujarati',
];

const popularCities = [
  'Chennai',
  'Bengaluru',
  'Mumbai',
  'Hyderabad',
  'Delhi',
  'Kolkata',
  'Pune',
  'Coimbatore',
  'Madurai',
];

export default function ApplyHostPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('22');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Tamil', 'English']);
  const [bio, setBio] = useState('');



  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 18) {
      setErrorMessage('You must be at least 18 years old to register as a host.');
      return;
    }

    if (!city.trim()) {
      setErrorMessage('Please specify your city.');
      return;
    }

    if (languages.length === 0) {
      setErrorMessage('Please select at least one language you can speak.');
      return;
    }



    if (!agreed) {
      setErrorMessage('Please confirm that you are 18+ and agree to community standards.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/hosts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          age: ageNum,
          city: city.trim(),
          languages,
          bio: bio.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmittedSuccess(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 selection:bg-pink-500 selection:text-white font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0d0d12]/80 border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-36 h-10">
              <Image 
                src="/logo-transparent.png" 
                alt="Friendoo Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
            >
              Back to Home
            </Link>
            <Link 
              href="/admin/hosts" 
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 transition hidden sm:inline-block"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 pt-10">
        {submittedSuccess ? (
          <div className="bg-[#14141e] border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl mt-8">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <BadgeCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Application Received!</h2>
              <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
                Thank you <span className="text-white font-semibold">{name}</span>! Your host details (Name, Age, City, Languages) have been registered directly in our review system.
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-[#0d0d14] border border-zinc-800/80 rounded-2xl p-5 text-left text-sm space-y-3 max-w-md mx-auto">
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Applicant:</span>
                <span className="text-white font-medium">{name} ({age} yrs)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Phone:</span>
                <span className="text-white font-medium">{phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">City & Languages:</span>
                <span className="text-white font-medium">{city} • {languages.join(', ')}</span>
              </div>

            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/" 
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition"
              >
                Return to Home
              </Link>
              <Link 
                href="/admin/hosts" 
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition"
              >
                View in Admin Portal
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Join Friendoo Host Community
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Apply as a Verified Voice Host
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Connect with callers in your favorite languages. Earn daily with flexible hours, complete caller privacy, and direct bank/UPI withdrawals.
              </p>
            </div>

            {/* Value Props Row */}
            <div className="grid sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">60% Revenue Share</h4>
                  <p className="text-zinc-500">Transparent per-minute earnings.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">100% Anonymous</h4>
                  <p className="text-zinc-500">Phone numbers never shared.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Daily Payouts</h4>
                  <p className="text-zinc-500">Direct to your UPI or Bank.</p>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Host Registration Form */}
            <form onSubmit={handleSubmit} className="bg-[#14141e] border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
              
              {/* SECTION 1: PERSONAL DETAILS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                  <User className="w-4 h-4 text-pink-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    1. Host Personal Details
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">
                      Full Name / Display Name <span className="text-pink-400">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priya Sundaram" 
                        className="w-full rounded-xl bg-[#0d0d14] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">
                      Mobile Number (WhatsApp/Calls) <span className="text-pink-400">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210" 
                        className="w-full rounded-xl bg-[#0d0d14] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">
                      Age (Years) <span className="text-pink-400">* (Min 18+)</span>
                    </label>
                    <input 
                      type="number" 
                      min="18" 
                      max="75"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="22" 
                      className="w-full rounded-xl bg-[#0d0d14] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">
                      Current City <span className="text-pink-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai, Bengaluru" 
                      className="w-full rounded-xl bg-[#0d0d14] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition"
                    />
                  </div>
                </div>

                {/* Popular City Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-zinc-500">Quick select:</span>
                  {popularCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        city.toLowerCase() === c.toLowerCase()
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Languages Multi-Select */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                    <span>Languages Spoken <span className="text-pink-400">*</span></span>
                    <span className="text-[11px] text-zinc-500 font-normal">Select all languages you speak</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map((lang) => {
                      const isSelected = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`text-xs px-3.5 py-2 rounded-xl font-medium border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-500/50 text-white font-bold shadow-md shadow-pink-500/20'
                              : 'bg-[#0d0d14] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-zinc-400">
                    Short Bio / Introduction (Optional)
                  </label>
                  <textarea 
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell callers a little about your conversational vibe or hobbies..." 
                    className="w-full rounded-xl bg-[#0d0d14] border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition resize-none"
                  />
                </div>
              </div>

              {/* SECTION 3: CONSENT & SUBMISSION */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-xs text-zinc-400 leading-relaxed">
                    I declare that I am 18 years or older, the mobile number provided belongs to me, and I agree to Friendoo Community Safety Standards.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-base shadow-xl shadow-pink-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting to Friendoo System…</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Host Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  );
}

