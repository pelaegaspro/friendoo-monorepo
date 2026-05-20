'use client';

import { NotificationItem as NotificationType } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, UserCheck, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NotificationItemProps {
  notification: NotificationType;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'friend_request': return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'request_accepted': return <UserCheck className="h-5 w-5 text-emerald-500" />;
      case 'new_message': return <MessageCircle className="h-5 w-5 text-purple-500" />;
      case 'daily_prompt': return <Sparkles className="h-5 w-5 text-amber-500" />;
      case 'support_reply': return <span className="text-base leading-none">🎫</span>;
      default: return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleClick = () => {
    const meta = notification.metadata || {};
    switch (notification.type) {
      case 'friend_request':
        if (meta.fromUid) router.push(`/profile/${meta.fromUid}`);
        break;
      case 'request_accepted':
      case 'new_message':
        if (meta.conversationId) router.push(`/chat/${meta.conversationId}`);
        break;
      case 'daily_prompt':
        router.push('/discover');
        break;
      case 'support_reply':
        if (notification.ticketId) {
          toast.info('View Ticket is coming soon. Check your email for full support history.');
        }
        break;
    }
  };

  if (notification.type === 'support_reply') {
    return (
      <div className="rounded-2xl border border-purple-800/30 bg-purple-950/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-900/50">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-white">Support Team replied</h4>
              <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 line-clamp-3">
              {notification.message || notification.body}
            </p>
            {notification.ticketId ? (
              <button
                type="button"
                onClick={handleClick}
                className="mt-2 text-xs font-medium text-purple-300 underline underline-offset-2"
              >
                View Ticket
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer",
        notification.read ? "bg-background opacity-80" : "bg-purple-500/5 shadow-sm border border-purple-500/10"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-xl",
        notification.read ? "bg-muted" : "bg-purple-500/10"
      )}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            "font-semibold text-sm",
            !notification.read && "text-purple-900"
          )}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.body}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 shrink-0" />
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
    </div>
  );
}
