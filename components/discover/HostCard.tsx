'use client';

import { MouseEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../src/components/ui/sheet';
import { callService } from '../../services/callService';
import type { DiscoverUser } from '../../services/discoverService';
import { useAuthStore } from '../../store/authStore';
import { useWallet } from '../../hooks/useWallet';
import { CoinPackageCard } from '../wallet/CoinPackageCard';

interface HostCardProps {
  user: DiscoverUser;
}

export function HostCard({ user }: HostCardProps) {
  const router = useRouter();
  const currentUid = useAuthStore((state) => state.user?.uid);
  const wallet = useWallet();
  const [isCalling, setIsCalling] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const photoUrl = user.photos?.[0] || user.photoURL || '';
  const languageLabel = user.languages?.length ? user.languages.join(', ') : 'Hindi';
  const cityLabel = user.city || 'India';
  const hostName = user.displayName || 'Friendoo Host';
  const rateLabel = user.ratePerMinute ?? 20;

  const openProfile = () => {
    router.push(`/profile/${user.id}`);
  };

  const handleCallPress = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!currentUid) {
      toast.error('Please sign in to start a call');
      return;
    }

    if (wallet.coinBalance < 15) {
      setTopUpOpen(true);
      toast.error('You need at least 15 coins to start a call. Top up now!');
      return;
    }

    setIsCalling(true);
    try {
      const callId = await callService.createCall(currentUid, user.id, rateLabel);
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
      setIsCalling(false);
    }
  };

  return (
    <>
      <article
        onClick={openProfile}
        className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={hostName}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-fuchsia-600 to-zinc-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="absolute right-3 top-3">
          <span className={`relative block h-3 w-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-zinc-500'}`}>
            {user.isOnline ? <span className="absolute inset-0 animate-pulse rounded-full bg-green-500" /> : null}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
          <h3 className="text-base font-bold text-white">{hostName}</h3>
          <p className="line-clamp-1 text-xs text-zinc-300">
            {cityLabel} • {languageLabel}
          </p>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1 text-xs text-white">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              4.8
            </div>
            <div className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">🪙 {rateLabel}/min</div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCallPress}
              disabled={isCalling}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 h-10 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-60"
            >
              <Phone className="h-4 w-4" />
              {isCalling ? 'Calling...' : 'Call'}
            </button>
          </div>
        </div>
      </article>

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
    </>
  );
}
