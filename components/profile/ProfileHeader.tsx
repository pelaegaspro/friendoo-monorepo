'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
import { Phone, Edit3, ShieldCheck, MapPin, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import type { UserProfile } from '../../src/types';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  friendshipStatus?: 'none' | 'pending' | 'friends';
  onAction?: (action: 'connect' | 'call' | 'message') => void;
  hideActions?: boolean;
}

export function ProfileHeader({ 
  profile, 
  isOwnProfile, 
  friendshipStatus = 'none',
  onAction,
  hideActions = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const isOnline = profile.isOnline ?? profile.onlineStatus;

  return (
    <div className="relative space-y-6">
      {/* Background/Cover (optional, but adds premium feel) */}
      <div className="h-32 w-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-b-[2.5rem]" />

      <div className="px-6 -mt-16 flex flex-col items-center">
        {/* Avatar */}
        <div className="relative group">
          <DiceBearAvatar
            seed={profile.uid || profile.displayName || 'user'}
            size={128}
            isOnline={!!isOnline}
            className="border-4 border-background shadow-xl"
          />
        </div>

        {/* Info */}
        <div className="mt-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black italic text-white tracking-tight">
              {profile.displayName?.toUpperCase()}
            </h1>
            {profile.trustScore && profile.trustScore > 90 && (
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            )}
          </div>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
            @{profile.username}
          </p>
        </div>

        {/* Badges/Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300 border-none gap-1 py-1 px-3">
            <MapPin className="h-3 w-3" /> {profile.city}
          </Badge>
          <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300 border-none gap-1 py-1 px-3">
            <Globe className="h-3 w-3" /> {profile.languages?.slice(0, 2).join(', ')}
            {profile.languages && profile.languages.length > 2 && ` +${profile.languages.length - 2}`}
          </Badge>
          {profile.trustScore && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1 px-3">
              Trust Score: {profile.trustScore}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {!hideActions ? (
        <div className="w-full flex gap-3 mt-8">
          {isOwnProfile ? (
            <Button 
              onClick={() => router.push('/profile/edit')}
              className="w-full h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold gap-2"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <>
              {friendshipStatus === 'friends' ? (
                <Button 
                  onClick={() => onAction?.('call')}
                  className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                >
                  <Phone className="h-4 w-4" /> Call
                </Button>
              ) : friendshipStatus === 'pending' ? (
                <Button disabled className="w-full h-12 rounded-2xl bg-zinc-800 text-zinc-500 font-bold">
                  Request Pending
                </Button>
              ) : (
                <Button 
                  onClick={() => onAction?.('connect')}
                  className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Connect with {profile.displayName}
                </Button>
              )}
            </>
          )}
        </div>
        ) : null}
      </div>
    </div>
  );
}
