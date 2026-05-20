'use client';

import { useState } from 'react';
import { 
  User, 
  TrendingUp, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  Star, 
  ChevronRight,
  MessageSquare,
  Gift,
  Trophy,
  Bell,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { useProfile } from '../../../hooks/useProfile';
import { useHostProfile } from '../../../hooks/useHostProfile';
import { cn } from '../../../lib/utils';
import { getAvatarUrl } from '../../../components/DiceBearAvatar';
import { toast } from 'react-hot-toast';

export default function HostDashboard() {
  const currentUid = useAuthStore((state) => state.user?.uid);
  const { profile } = useProfile(currentUid || '');
  const { hostProfile, toggleOnline, isLoading: isHostLoading } = useHostProfile(currentUid || '');

  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await toggleOnline();
      toast.success(!hostProfile?.isOnline ? 'You are now Online!' : 'You are now Offline');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  if (!profile || isHostLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const declinedToday = hostProfile?.declinedToday || 0;
  const declineLimit = 5;
  const declinePercentage = Math.min((declinedToday / declineLimit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-24 px-4 pt-6 overflow-y-auto">
      {/* Top Area: Identity & Status */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={getAvatarUrl(profile.avatarSeed || profile.uid, 112)}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10"
            />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0F172A]",
              hostProfile?.isOnline ? "bg-green-500" : "bg-slate-500"
            )} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{profile.displayName}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Host</span>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-medium">{hostProfile?.rating?.toFixed(1) || '5.0'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Availability Toggle */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={cn(
              "relative w-20 h-9 rounded-full transition-all duration-300 flex items-center px-1 border border-white/10",
              hostProfile?.isOnline ? "bg-emerald-500" : "bg-slate-700",
              isToggling && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 transform flex items-center justify-center",
              hostProfile?.isOnline ? "translate-x-11" : "translate-x-0"
            )}>
               {isToggling && <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
            </div>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
            {hostProfile?.isOnline ? 'Available' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Live Activity Section */}
      <section className="mb-6">
        <div className={cn(
          "p-5 rounded-3xl border relative overflow-hidden transition-all duration-500",
          hostProfile?.isOnline 
            ? "bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/30" 
            : "bg-white/5 border-white/5"
        )}>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em]",
                hostProfile?.isOnline ? "text-emerald-400" : "text-slate-500"
              )}>
                Current Status
              </span>
              <p className="text-xl font-bold mt-1">
                {hostProfile?.isOnline ? "Ready for calls" : "You're Offline"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {hostProfile?.isOnline 
                  ? "Incoming calls will appear here. Keep the app open."
                  : "Go online to start receiving calls from users."}
              </p>
            </div>
            <div className="relative">
              {hostProfile?.isOnline ? (
                <>
                  <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                  <Bell className="w-10 h-10 text-emerald-500 relative animate-bounce-slow" />
                </>
              ) : (
                <XCircle className="w-10 h-10 text-slate-600" />
              )}
            </div>
          </div>
        </div>

        {/* Today Highlights Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calls Today</span>
            </div>
            <p className="text-2xl font-bold">{hostProfile?.callsToday || 0}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Minutes</span>
            </div>
            <p className="text-2xl font-bold">{hostProfile?.minutesToday || 0}</p>
          </div>
        </div>

        {/* Decline Limit Progress - STRICT RULES */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Declines</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              declinedToday >= 4 ? "bg-rose-500/20 text-rose-500" : "bg-white/10 text-slate-300"
            )}>
              {declinedToday} / {declineLimit}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 rounded-full",
                declinedToday >= 4 ? "bg-rose-500" : "bg-emerald-500"
              )}
              style={{ width: `${declinePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            * 5 declines per day = Automatic offline ban.
          </p>
        </div>
      </section>

      {/* Earnings Snapshot */}
      <section className="mb-6">
        <Link href="/earnings" className="block active:scale-[0.98] transition-transform">
          <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/10 p-5 rounded-3xl border border-teal-500/30 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500 blur-[60px] opacity-20" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.2em]">Daily Earnings</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-black">{hostProfile?.todayEarnings || 0}</p>
                  <p className="text-xs font-bold text-teal-500/60 uppercase">Coins</p>
                </div>
              </div>
              <div className="bg-teal-500/20 p-2.5 rounded-2xl border border-teal-500/20">
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet Details</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-teal-500">
                VIEW ALL <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Quick Actions Grid */}
      <section className="mb-6">
        <h3 className="text-[10px] font-bold text-slate-500 mb-3 px-1 uppercase tracking-[0.2em]">Shortcuts</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/history" className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5 active:bg-white/10 transition-colors">
            <div className="bg-blue-500/20 p-2 rounded-xl">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight">Messages</span>
          </Link>
          <Link href={`/profile/${currentUid}`} className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5 active:bg-white/10 transition-colors">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <User className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight">Edit Bio</span>
          </Link>
          <Link href="/rewards" className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5 active:bg-white/10 transition-colors">
            <div className="bg-amber-500/20 p-2 rounded-xl">
              <Gift className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight">My Rewards</span>
          </Link>
          <Link href="/leaderboard" className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5 active:bg-white/10 transition-colors">
            <div className="bg-purple-500/20 p-2 rounded-xl">
              <Trophy className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight">Ranking</span>
          </Link>
        </div>
      </section>

      {/* System Tip */}
      <section>
        <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5 flex gap-4 items-start">
          <div className="bg-emerald-500/10 p-2 rounded-full mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Growth Tip</span>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Accepting 3 calls in a row boosts your profile visibility by 2x for the next hour!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
