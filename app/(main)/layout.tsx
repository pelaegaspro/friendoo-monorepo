'use client';

import { ReactNode } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { BottomNav } from '../../components/layout/BottomNav';
import { useHostPresence } from '../../hooks/useHostPresence';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';

export default function MainLayout({ children }: { children: ReactNode }) {
  const uid = useAuthStore((state) => state.user?.uid) || '';
  const { profile } = useProfile(uid);
  const isHost = Boolean(profile?.isHost);
  const { isOnline, goOnline, goOffline } = useHostPresence(uid, isHost);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Main Content Area */}
      <main className="flex-1 relative">
        {children}
      </main>

      {isHost ? (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => void (isOnline ? goOffline() : goOnline())}
            className={`flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-xl transition active:scale-95 ${
              isOnline
                ? 'border-emerald-400/50 bg-emerald-500 shadow-emerald-500/20'
                : 'border-zinc-700 bg-zinc-800 shadow-black/20'
            }`}
            aria-label={isOnline ? 'Go offline' : 'Go online'}
          >
            {isOnline ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
          </button>
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      ) : null}

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
