'use client';

import { Card } from '../../src/components/ui/card';
import { Users, MessageCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileStatsProps {
  friendCount: number;
  conversationCount: number;
  createdAt: any; // Firestore Timestamp
}

export function ProfileStats({ 
  friendCount, 
  conversationCount, 
  createdAt 
}: ProfileStatsProps) {
  const memberSince = createdAt instanceof Date 
    ? createdAt 
    : createdAt?.toDate?.() ?? new Date();

  const stats = [
    { 
      label: 'Friends', 
      value: friendCount, 
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Chats', 
      value: conversationCount, 
      icon: MessageCircle,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    { 
      label: 'Joined', 
      value: format(memberSince, 'MMM yyyy'), 
      icon: Calendar,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card 
          key={stat.label} 
          className="bg-zinc-900 border-zinc-800 p-4 flex flex-col items-center text-center space-y-2 rounded-2xl"
        >
          <div className={cn("p-2 rounded-xl", stat.bg)}>
            <stat.icon className={cn("h-5 w-5", stat.color)} />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-black text-white leading-none">
              {stat.value}
            </p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Helper to avoid import issues in this snippet
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
