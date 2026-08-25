import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Mail, MapPin, Clock } from 'lucide-react';

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-300 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Friendoo
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Grievance Redressal Desk</h1>
          <p className="text-sm text-zinc-500">In accordance with the Information Technology Act, 2000 and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              Resident Grievance Officer Details
            </div>
            
            <p className="text-sm leading-relaxed">
              If you have any grievances, concerns, or complaints regarding content, safety, privacy, host conduct, or platform violations on Friendoo, you may contact our designated Resident Grievance Officer:
            </p>

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="text-xs text-zinc-500 uppercase font-semibold">Grievance Officer</div>
                <div className="text-lg font-bold text-white">Nodal Grievance Officer</div>
                <div className="text-sm text-purple-400 font-medium">Friendoo Technologies</div>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="text-xs text-zinc-500 uppercase font-semibold">Email for Official Complaints</div>
                <div className="text-base font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-400" />
                  grievance@friendoo.in
                </div>
                <div className="text-xs text-zinc-500">Also CC: contact@friendoo.in</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <MapPin className="w-4 h-4 text-purple-400" />
                Physical Address for Legal & Regulatory Correspondence
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Friendoo Technologies (MSME Registered Enterprise)<br />
                India
              </p>
            </div>
          </div>

          <div className="bg-[#18181f] border border-zinc-800 p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-white font-bold text-xl">
              <Clock className="w-5 h-5 text-teal-400" />
              Redressal Timelines
            </div>
            <ul className="list-disc pl-6 text-sm space-y-3 text-zinc-400">
              <li><strong>Acknowledgment:</strong> All complaints will be acknowledged within <strong>24 hours</strong> of receipt with a unique grievance tracking ID.</li>
              <li><strong>Resolution:</strong> Every grievance shall be disposed of and redressed within <strong>15 days</strong> from the date of its receipt in compliance with statutory guidelines.</li>
              <li><strong>Emergency Safety Reports:</strong> Allegations of impersonation, non-consensual content, or serious harassment are prioritized for urgent action within 24 hours.</li>
            </ul>
          </div>
        </div>

        <footer className="pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
          &copy; 2026 Friendoo. All rights reserved. Compliant with IT Rules 2021 & DPDPA 2023.
        </footer>
      </div>
    </div>
  );
}
