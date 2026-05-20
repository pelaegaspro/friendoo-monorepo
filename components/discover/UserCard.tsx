'use client';

import { DiscoverUser } from '../../services/discoverService';
import { DiceBearAvatar } from '../../src/components/DiceBearAvatar';
import { Badge } from '../../src/components/ui/badge';
import { Button } from '../../src/components/ui/button';
import { cn } from '../../lib/utils';
import { Phone, UserPlus, Clock } from 'lucide-react';
import { useFriendRequest } from '../../hooks/useFriendRequest';
import { useRouter } from 'next/navigation';

interface UserCardProps {
  user: DiscoverUser;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const { status, sendRequest, loading } = useFriendRequest(user.id);

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score > 70) return 'bg-emerald-500';
    if (score > 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const peerName = user.anonymousModeEnabled ? 'Anonymous' : user.displayName;
  const fallback = peerName.slice(0, 1).toUpperCase();

  const handleCall = () => {
    router.push(`/call/outgoing/${user.id}`);
  };

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <DiceBearAvatar seed={user.id || peerName} size={64} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-lg truncate">{peerName}</h3>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase",
              getScoreColor(user.compatibilityScore)
            )}>
              {user.compatibilityScore}% Match
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <span>{user.city || 'Unknown City'}</span>
            <span>•</span>
            <span className="truncate">{user.languages?.join(', ') || 'English'}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {user.interests?.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-[10px] px-2 py-0">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t">
        {status === 'friends' ? (
          <Button 
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700"
            onClick={handleCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        ) : (
          <Button
            variant={status === 'none' ? 'default' : 'secondary'}
            className={cn(
              "flex-1 rounded-xl transition-all",
              status === 'none' ? "bg-purple-600 hover:bg-purple-700" : "bg-muted"
            )}
            disabled={status !== 'none' || loading}
            onClick={() => sendRequest()}
          >
            {status === 'none' ? (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
              </>
            ) : (
              'Pending'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
