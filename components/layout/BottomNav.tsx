'use client';

import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, User, Wallet, Trophy, Gift, Clock, LayoutDashboard } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';

export function BottomNav() {
  const { pathname } = useLocation();
  const currentUid = useAuthStore((state: any) => state.user?.uid);
  const { profile } = useProfile(currentUid || '');
  const isHost = Boolean(profile?.isHost);
  const profileHref = currentUid ? `/profile/${currentUid}` : '/settings';

  const hostTabs = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Earnings', href: '/earnings', icon: TrendingUp },
    { name: 'Profile', href: profileHref, icon: User },
  ];

  const userTabs = [
    { name: 'Home', href: '/discover', icon: Home },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Rewards', href: '/rewards', icon: Gift },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Profile', href: profileHref, icon: User },
  ];

  const tabs = isHost ? hostTabs : userTabs;

  // Hide on call screens
  if (pathname?.startsWith('/call/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-[max(env(safe-area-inset-bottom),8px)] px-2">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.name === 'Profile'
              ? pathname?.startsWith('/profile/')
              : pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
                isActive ? "text-purple-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className="text-[10px] font-medium mt-1">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
