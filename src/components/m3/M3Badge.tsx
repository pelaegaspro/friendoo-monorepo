import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface M3BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
  size?: 'small' | 'medium' | 'large';
}

export const M3Badge = forwardRef<HTMLDivElement, M3BadgeProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'medium',
    children,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]',
      secondary: 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]',
      tertiary: 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]',
      error: 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]',
      success: 'bg-[#10B981] text-white',
    };
    
    const sizes = {
      small: 'px-2 py-0.5 text-xs',
      medium: 'px-2.5 py-1 text-sm',
      large: 'px-3 py-1.5 text-base',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-full',
          'font-medium',
          'whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

M3Badge.displayName = 'M3Badge';
