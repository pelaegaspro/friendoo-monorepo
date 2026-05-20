'use client';

import { useState } from 'react';
import { Button } from '../../../src/components/ui/button';
import { Shield, Ban, Flag, Info, ChevronRight, Phone } from 'lucide-react';
import { ReportSheet } from '../../../components/safety/ReportSheet';
import { BlockedUsersList } from '../../../components/safety/BlockedUsersList';
import { useRouter } from 'next/navigation';

export default function SafetyPage() {
  const router = useRouter();
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background pb-24">
      <header className="px-6 py-8 space-y-2">
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase">Safety Center</h1>
        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
          Your safety is our priority. Use these tools to control your experience.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-none">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="flex flex-col h-auto p-6 gap-3 rounded-[2rem] border-2 border-zinc-900 hover:bg-rose-500/5 hover:border-rose-500/20 group transition-all"
            onClick={() => setReportSheetOpen(true)}
          >
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <Flag className="h-6 w-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Report</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col h-auto p-6 gap-3 rounded-[2rem] border-2 border-zinc-900 hover:bg-zinc-800 transition-all group"
          >
            <div className="p-3 rounded-2xl bg-zinc-900 text-zinc-400 group-hover:scale-110 transition-transform">
              <Ban className="h-6 w-6" />
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Blocked</span>
          </Button>
        </div>

        {/* Blocked Users List */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Manage Blocked Users</h2>
          <BlockedUsersList />
        </section>

        {/* Resources */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Resources & Help</h2>
          <div className="space-y-2">
            {[
              { label: 'Community Guidelines', icon: Info, href: '/guidelines' },
              { label: 'Privacy Policy', icon: Shield, href: '/privacy' },
            ].map(item => (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 transition-colors border border-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-900">
                    <item.icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="font-bold text-sm text-zinc-300">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </button>
            ))}
          </div>
        </section>

        {/* SOS / Emergency */}
        <section className="p-6 rounded-[2.5rem] bg-purple-600 text-white space-y-4 shadow-xl shadow-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Phone className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tight">Emergency Help</h2>
          </div>
          <p className="text-xs text-purple-100 font-medium leading-relaxed">
            If you are in immediate danger or need urgent help, please contact local emergency services.
          </p>
          <Button variant="secondary" className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-white text-purple-600 hover:bg-zinc-100">
            Call 112 (Police)
          </Button>
        </section>
      </main>

      <ReportSheet open={reportSheetOpen} onOpenChange={setReportSheetOpen} />
    </div>
  );
}
