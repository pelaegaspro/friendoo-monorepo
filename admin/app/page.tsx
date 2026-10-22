import Image from 'next/image';
import Link from 'next/link';
import { 
   
  ShieldCheck, 
  Languages, 
  Sparkles, 
  Headphones, 
  Lock, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  HeartHandshake 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 selection:bg-purple-500 selection:text-white font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0d0d12]/80 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#safety" className="hover:text-white transition-colors">Safety & Privacy</a>
            <Link href="/apply-host" className="hover:text-pink-400 text-pink-300 transition-colors font-semibold">Become a Host</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/apply-host" className="hover:text-white transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/admin/portal" 
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
            >
              Admin Portal
            </Link>
            <a 
              href="#download"
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download App
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              India&apos;s Premier 1-on-1 Voice & Video Social App
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Real Conversations. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-teal-300">
                Instant Voice Connections.
              </span>
            </h1>

            <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Connect 1-on-1 with verified friendly hosts in your native language. Enjoy anonymous audio & video calls with complete privacy, zero judgment, and crystal-clear sound across India.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a 
                href="#download" 
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-purple-600/25 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                Get on Google Play
              </a>
              <a 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-base hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Explore Features
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-800/80">
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-zinc-500">Anonymous & Safe</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">10+</div>
                <div className="text-xs text-zinc-500">Indian Languages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">&lt;1s</div>
                <div className="text-xs text-zinc-500">Instant Connect</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-video rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-purple-950/40">
              <Image 
                src="/hero-banner.jpg" 
                alt="Friendoo Calling App Mockup" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-[#111118] border-y border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Engineered for Genuine Human Connection
            </h2>
            <p className="text-zinc-400 text-base">
              Experience a modern voice platform tailored for seamless communication, privacy, and authentic regional conversations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-purple-500/40 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">100% Anonymity & Desi Avatars</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Interact with custom Desi Avatars and aliases. No real phone numbers or personal social media handles are ever exposed to callers.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-teal-500/40 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Languages className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Regional Indian Languages</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Connect in Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Punjabi, and English with hosts who share your culture.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-pink-500/40 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">HD Telecom & Low Latency</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Powered by state-of-the-art WebRTC audio engineering. Crystal clear voice calls even on 3G and congested mobile networks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Compliance Section */}
      <section id="safety" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
            <Image 
              src="/app-showcase.jpg" 
              alt="Friendoo Safe Audio Chat" 
              fill 
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safety & Compliance First
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              A Safe, Respectful & Moderated Space
            </h2>

            <p className="text-zinc-400 leading-relaxed">
              We uphold strict community standards and comply with the Digital Personal Data Protection Act (DPDPA) 2023 and Information Technology Rules 2021.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold text-sm">Strict 18+ Age Verification</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Platform is exclusively for consenting adults with automated age declaration policies.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold text-sm">Zero Tolerance Harassment Shield</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Automated safety triggers, 3-strike host silence suspensions, and 1-tap caller block/report.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold text-sm">Statutory Grievance Redressal</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Dedicated Resident Grievance Officer responding to user inquiries within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Hosts Section */}
      <section id="hosts" className="py-24 bg-gradient-to-b from-[#111118] to-[#0d0d12] border-t border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white">
            Earn Daily by Talking Online on Friendoo
          </h2>

          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Are you a great conversationalist? Join thousands of verified voice hosts. Set your own flexible hours, receive 60% transparent revenue share, and get automated daily bank payouts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link 
              href="/contact" 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition"
            >
              Apply as a Verified Host
            </Link>
          </div>
        </div>
      </section>

      {/* Download App CTA */}
      <section id="download" className="py-20 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to Start Connecting?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Download Friendoo now on your Android phone and start your first conversation in seconds!
          </p>
          <div className="pt-4 flex justify-center">
            <a 
              href="#" 
              className="px-8 py-4 rounded-2xl bg-white text-zinc-950 font-bold text-base hover:bg-zinc-200 transition shadow-2xl flex items-center gap-3"
            >
              <Download className="w-5 h-5 text-purple-600" />
              Download APK / Google Play
            </a>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer & Compliance Links */}
      <footer className="bg-[#08080c] border-t border-zinc-800 text-zinc-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 space-y-4">
            <div className="relative w-32 h-9">
              <Image 
                src="/logo-transparent.png" 
                alt="Friendoo" 
                fill 
                className="object-contain"
              />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              Friendoo is India&apos;s leading voice and video communication platform, providing safe, anonymous, and culturally resonant 1-on-1 audio conversations.
            </p>
            <div className="text-xs text-zinc-600">
              Registered MSME Service Enterprise | DPDPA 2023 Compliant
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Product</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-zinc-300 transition">Audio Calling</a></li>
              <li><a href="#features" className="hover:text-zinc-300 transition">Desi Avatars</a></li>
              <li><a href="#hosts" className="hover:text-zinc-300 transition">Host Program</a></li>
              <li><a href="#download" className="hover:text-zinc-300 transition">Android App</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Legal & Compliance</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-zinc-300 transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-zinc-300 transition">Privacy Policy (DPDPA)</Link></li>
              <li><Link href="/refunds" className="hover:text-zinc-300 transition">Refund & Cancellation</Link></li>
              <li><Link href="/grievance" className="hover:text-zinc-300 transition">Grievance Redressal</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Company & Support</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-zinc-300 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-zinc-300 transition">Contact Us</Link></li>
              <li><Link href="/admin/portal" className="hover:text-zinc-300 transition">Admin Portal</Link></li>
              <li><span className="text-zinc-600">contact@friendoo.in</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-600">
          <div>&copy; 2026 Friendoo. All rights reserved.</div>
          <div className="mt-2 md:mt-0">Compliant with Information Technology (Intermediary Guidelines) Rules 2021 & DPDPA 2023.</div>
        </div>
      </footer>
    </div>
  );
}
