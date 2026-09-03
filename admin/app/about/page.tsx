import Link from 'next/link';
import { ArrowLeft, Sparkles, ShieldCheck, Globe2, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Friendoo
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">About Friendoo</h1>
          <p className="text-sm text-zinc-500">Bridging distances with real, authentic voice conversations across India.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Our Mission
            </div>
            <p className="text-sm leading-relaxed">
              In a digital world dominated by filtered photos and endless scrolling, genuine human connection is often lost. Friendoo was built to bring back the power of the human voice.
            </p>
            <p className="text-sm leading-relaxed">
              We empower people across India to connect 1-on-1 with verified friendly hosts, practice regional languages, share stories, and find companionship in a safe, judgment-free, and anonymous environment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#18181f] border border-zinc-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Cultural Diversity</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Celebrating India&apos;s linguistic richness with support for Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, and Punjabi.
              </p>
            </div>

            <div className="bg-[#18181f] border border-zinc-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Anonymity & Safety</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Complete user privacy with custom Desi Avatars, automated AI safety shields, and zero disclosure of phone numbers.
              </p>
            </div>

            <div className="bg-[#18181f] border border-zinc-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Creator Empowerment</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Transparent 60% revenue sharing and daily payouts empowering talented communicators and voice creators across India.
              </p>
            </div>
          </div>
        </div>

        <footer className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
          &copy; 2026 Friendoo. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
