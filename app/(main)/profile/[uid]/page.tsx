'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProfile } from '../../../../hooks/useProfile';
import { useWallet } from '../../../../hooks/useWallet';
import { useAuthStore } from '../../../../store/authStore';
import { ProfileHeader } from '../../../../components/profile/ProfileHeader';
import { InterestTags } from '../../../../components/profile/InterestTags';
import { ProfileStats } from '../../../../components/profile/ProfileStats';
import { CoinPackageCard } from '../../../../components/wallet/CoinPackageCard';
import { Skeleton } from '../../../../src/components/ui/skeleton';
import {
  ChevronLeft,
  Languages,
  MoreVertical,
  Phone,
  ShieldAlert,
  Star,
  Flag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../src/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../../src/components/ui/sheet';
import { toast } from 'sonner';
import { callService } from '../../../../services/callService';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

function getFirebase() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  return { app, db };
}

export default function ProfilePage() {
  const { uid } = useParams();
  const router = useRouter();
  const currentUid = useAuthStore(state => state.user?.uid);
  const wallet = useWallet();
  const [totalCalls, setTotalCalls] = useState(0);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  
  const { 
    profile, 
    isLoading, 
    isOwnProfile 
  } = useProfile(uid as string);

  const isHostProfile = Boolean(profile?.isHost);
  const isHostOnline = profile?.isOnline ?? profile?.onlineStatus;
  const hostRate = profile?.ratePerMinute ?? 20;

  useEffect(() => {
    if (!profile?.uid || !profile.isHost) {
      setTotalCalls(0);
      return;
    }

    let cancelled = false;

    const loadHostStats = async () => {
      try {
        const { db } = getFirebase();
        const callsQuery = query(collection(db, 'calls'), where('toUserId', '==', profile.uid));
        const snapshot = await getDocs(callsQuery);
        if (!cancelled) {
          setTotalCalls(snapshot.size);
        }
      } catch (error) {
        console.error('Failed to load host stats', error);
      }
    };

    void loadHostStats();

    return () => {
      cancelled = true;
    };
  }, [profile?.isHost, profile?.uid]);

  const hostLanguagesLabel = useMemo(
    () => profile?.languages?.length ? profile.languages.join(', ') : 'Hindi',
    [profile?.languages]
  );

  const handleAction = (action: 'connect' | 'call') => {
    if (action === 'call') {
      // Logic for starting call
      toast.info('Starting call...');
    }
  };

  const handleHostCall = async () => {
    if (!profile?.uid || !currentUid) return;
    if (wallet.coinBalance < 15) {
      setTopUpOpen(true);
      toast.error('You need at least 15 coins to start a call. Top up now!');
      return;
    }

    setIsStartingCall(true);
    try {
      const callId = await callService.createCall(currentUid, profile.uid, hostRate);
      router.push(`/call/outgoing/${callId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start call';
      if (message.includes('INSUFFICIENT_COINS')) {
        setTopUpOpen(true);
        toast.error('You need at least 15 coins to start a call. Top up now!');
      } else {
        toast.error(message);
      }
    } finally {
      setIsStartingCall(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <div className="h-48 w-full bg-zinc-900 animate-pulse rounded-b-[2.5rem]" />
        <div className="px-6 -mt-16 space-y-8">
          <div className="flex flex-col items-center">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
            <Skeleton className="h-8 w-48 mt-4 rounded-xl" />
            <Skeleton className="h-4 w-32 mt-2 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Profile not found</h2>
        <p className="text-zinc-500 text-sm">The user you're looking for doesn't exist or has been deactivated.</p>
        <button 
          onClick={() => router.back()}
          className="text-purple-400 font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background pb-24">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/40 to-transparent">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {!isOwnProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors">
                <MoreVertical className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-48 rounded-2xl">
              <DropdownMenuItem className="gap-2 focus:bg-zinc-800 focus:text-white py-3 px-4">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Block User
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-zinc-800 focus:text-white py-3 px-4">
                <Flag className="h-4 w-4 text-zinc-400" /> Report User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Header Section */}
      <ProfileHeader 
        profile={profile} 
        isOwnProfile={isOwnProfile}
        onAction={handleAction}
        hideActions={Boolean(!isOwnProfile && isHostProfile)}
      />

      {/* Content Section */}
      <div className="px-6 mt-8 space-y-8">
        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">
              About
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Stats */}
        <ProfileStats 
          friendCount={profile.friendCount || 0}
          conversationCount={profile.conversationCount || 0}
          createdAt={profile.createdAt}
        />

        {/* Interests */}
        <InterestTags interests={profile.interests || []} />

        {isHostProfile ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Total Calls</p>
                <p className="mt-3 text-2xl font-black text-white">{totalCalls}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Rating</p>
                <p className="mt-3 flex items-center justify-center gap-1 text-2xl font-black text-white">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  4.8
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Languages</p>
                <p className="mt-3 text-2xl font-black text-white">
                  {profile.languages?.length || 0}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-purple-600 to-fuchsia-600 p-[1px] shadow-lg shadow-purple-900/30">
              <div className="rounded-[27px] bg-zinc-950/90 px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200/80">
                  Host Rate
                </p>
                <p className="mt-3 text-2xl font-black text-white">🪙 {hostRate} coins per minute</p>
                <p className="mt-2 text-sm text-purple-100/80">
                  Start a call to connect instantly with this host.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Availability</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <span className={`h-2.5 w-2.5 rounded-full ${isHostOnline ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                  {isHostOnline ? 'Online Now' : 'Offline'}
                </p>
              </div>
              <div className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-xs font-semibold text-zinc-300">
                {profile.city || 'Remote'} • {hostLanguagesLabel}
              </div>
            </div>

            {!isOwnProfile ? (
              <button
                type="button"
                onClick={() => void handleHostCall()}
                disabled={isStartingCall}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 disabled:opacity-60"
              >
                <Phone className="h-5 w-5" />
                {isStartingCall ? 'Starting Call...' : 'Call Now'}
              </button>
            ) : null}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Reviews</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                No reviews yet
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <Sheet open={topUpOpen} onOpenChange={setTopUpOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-zinc-800 bg-zinc-950 text-white">
          <SheetHeader className="px-5 pt-5">
            <SheetTitle>Top Up Coins</SheetTitle>
            <SheetDescription>
              You need at least 15 coins to start a call. Top up now!
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 px-5 pb-6">
            {wallet.packages.slice(0, 4).map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={async () => {
                  await wallet.topup(pkg.id, {
                    onSuccess: () => {
                      setTopUpOpen(false);
                      toast.success('Coins added!');
                    },
                    onFailure: (message) => toast.error(message),
                  });
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
