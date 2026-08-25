import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, HeartHandshake, PhoneCall } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Friendoo
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-sm text-zinc-500">We are here to assist you with app support, host partnerships, billing, and general inquiries.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">General & Support</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              For account support, coin balances, login assistance, and general feedback:
            </p>
            <div className="text-base font-semibold text-purple-400">
              contact@friendoo.in
            </div>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Host Onboarding & Partnerships</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Interested in becoming a verified voice host or partnering with Friendoo?
            </p>
            <div className="text-base font-semibold text-teal-400">
              hosts@friendoo.in
            </div>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Billing & Payments</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              For transaction verification, recharge issues, or refund inquiries:
            </p>
            <div className="text-base font-semibold text-pink-400">
              billing@friendoo.in
            </div>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Legal & Compliance</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              For regulatory, law enforcement, and grievance correspondence:
            </p>
            <div className="text-base font-semibold text-indigo-400">
              grievance@friendoo.in
            </div>
          </div>
        </div>

        <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-3 text-center">
          <div className="text-white font-bold text-lg">Registered Business Entity</div>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Friendoo Technologies &bull; Registered MSME Enterprise &bull; India<br />
            Official Domain: <strong>https://friendoo.in</strong>
          </p>
        </div>

        <footer className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
          &copy; 2026 Friendoo. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
