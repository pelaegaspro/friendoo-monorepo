import { cn } from '@/lib/utils';

interface DiceBearAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  isOnline?: boolean;
}

/**
 * Canonical avatar URL builder. All platforms must use this exact formula.
 * Style is hardcoded to 'open-peeps' — no user-selectable styles.
 */
export function getAvatarUrl(seed: string, size: number = 128): string {
  return `https://api.dicebear.com/9.x/open-peeps/png?seed=${encodeURIComponent(seed)}&size=${size}`;
}

export function DiceBearAvatar({
  seed,
  size = 48,
  className,
  isOnline = false,
}: DiceBearAvatarProps) {
  const url = getAvatarUrl(seed, size * 2);

  return (
    <div className={cn('relative shrink-0', className)}>
      <img
        src={url}
        alt={`Avatar for ${seed}`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
      {isOnline && (
        <div
          className="absolute bottom-0 right-0 bg-green-500 border-2 border-background rounded-full"
          style={{ width: size * 0.25, height: size * 0.25 }}
        />
      )}
    </div>
  );
}

/**
 * DiceBear-based AvatarFallback for use with shadcn Avatar pattern
 */
export function DiceBearFallback({ seed, className }: { seed: string; className?: string }) {
  const url = getAvatarUrl(seed, 128);
  return (
    <img
      src={url}
      alt={`Avatar for ${seed}`}
      className={cn('w-full h-full object-cover rounded-full', className)}
    />
  );
}
