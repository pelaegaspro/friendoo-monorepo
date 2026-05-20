import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/components/DiceBearAvatar';

interface M3AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  avatarSeed?: string;
  isOnline?: boolean;
}

export const M3Avatar = forwardRef<HTMLDivElement, M3AvatarProps>(
  ({
    className,
    src,
    alt,
    size = 'medium',
    avatarSeed,
    isOnline = false,
    ...props
  }, ref) => {
    const sizes = {
      small: { class: 'w-8 h-8', px: 64 },
      medium: { class: 'w-12 h-12', px: 96 },
      large: { class: 'w-16 h-16', px: 128 },
      xlarge: { class: 'w-20 h-20', px: 160 },
    };

    const { class: sizeClass, px } = sizes[size];
    const avatarSrc = src || (avatarSeed ? getAvatarUrl(avatarSeed, px) : undefined);

    return (
      <div ref={ref} className={cn('relative shrink-0', className)} {...props}>
        <div className={cn(
          'rounded-full overflow-hidden',
          'border-2 border-[var(--md-sys-color-primary)]/20',
          sizeClass
        )}>
          {avatarSrc ? (
            <img src={avatarSrc} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
          ) : (
            <div className={cn(
              'w-full h-full flex items-center justify-center font-bold',
              'bg-[var(--md-sys-color-primary-container)]',
              'text-[var(--md-sys-color-on-primary-container)]'
            )}>
              <span>?</span>
            </div>
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--bg-primary)] rounded-full" />
        )}
      </div>
    );
  }
);

M3Avatar.displayName = 'M3Avatar';

interface M3AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: { src?: string; alt?: string; avatarSeed?: string }[];
  max?: number;
  size?: 'small' | 'medium' | 'large';
}

export const M3AvatarGroup = forwardRef<HTMLDivElement, M3AvatarGroupProps>(
  ({ avatars, max = 4, size = 'small', className, ...props }, ref) => {
    const visible = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
      <div ref={ref} className={cn('flex -space-x-2', className)} {...props}>
        {visible.map((avatar, i) => (
          <M3Avatar
            key={i}
            src={avatar.src}
            avatarSeed={avatar.avatarSeed}
            alt={avatar.alt}
            size={size}
            className="ring-2 ring-[var(--bg-primary)]"
          />
        ))}
        {remaining > 0 && (
          <div className={cn(
            'rounded-full flex items-center justify-center font-medium',
            'bg-[var(--md-sys-color-surface-variant)]',
            'text-[var(--md-sys-color-on-surface-variant)]',
            'ring-2 ring-[var(--bg-primary)]',
            size === 'small' ? 'w-8 h-8 text-xs' :
            size === 'medium' ? 'w-12 h-12 text-sm' :
            'w-16 h-16 text-base'
          )}>
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);

M3AvatarGroup.displayName = 'M3AvatarGroup';
