import Link from 'next/link';
import { ArrowLeft, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Friendoo
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Cancellation & Refund Policy</h1>
          <p className="text-sm text-zinc-500">Last Updated: August 24, 2026 | Effective for all Friendoo users</p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <RefreshCw className="w-5 h-5 text-purple-400" />
              1. Overview & Coin Recharge Purchases
            </div>
            <p className="text-sm leading-relaxed">
              Friendoo operates on a server-authoritative digital coin system. When you purchase coin packages (e.g., ₹49 for 50 Coins), the purchased coins are credited instantly to your in-app wallet upon successful UPI or payment gateway confirmation.
            </p>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              2. 5-Second Free Grace Period & Technical Disconnections
            </div>
            <p className="text-sm leading-relaxed">
              To ensure fair billing, all calls on Friendoo include a <strong>5-second free grace period</strong>. If a call disconnects or is ended within 5 seconds of connection, <strong>zero coins (0 coins)</strong> are deducted from your balance.
            </p>
            <p className="text-sm leading-relaxed">
              In the event of a verified technical disconnection, RTC telecom failure, or host silence policy violation (Strike 3), coins are automatically refunded back to your wallet by our server-authoritative ledger.
            </p>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <AlertCircle className="w-5 h-5 text-pink-400" />
              3. Unutilized Coin Balance Refunds
            </div>
            <p className="text-sm leading-relaxed">
              If you purchased coins and wish to request a refund for the <strong>unutilized/unspent coin balance</strong>, you may submit a request within <strong>7 days</strong> of the transaction date.
            </p>
            <ul className="list-disc pl-6 text-sm space-y-2 text-zinc-400">
              <li>Refund requests must be sent from your registered account to <strong>billing@friendoo.in</strong> or <strong>contact@friendoo.in</strong> with your registered mobile number and transaction ID.</li>
              <li>Approved refunds are processed back to the original payment source (UPI / Bank Account) within <strong>5 to 7 business days</strong>.</li>
              <li>Utilized coins (coins consumed during completed voice/video conversations) are non-refundable.</li>
            </ul>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <h2 className="text-white font-bold text-xl">4. User Inactivity & Abuse Policy</h2>
            <p className="text-sm leading-relaxed">
              If a user triggers the in-call User Inactivity Policy (3 consecutive 15-second qualifying silence intervals resulting in call termination), no refund shall be issued for that specific call duration in accordance with platform terms.
            </p>
          </div>
        </div>

        <footer className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
          &copy; 2026 Friendoo. All rights reserved. Registered MSME Service Enterprise.
        </footer>
      </div>
    </div>
  );
}
