import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface M3ChipProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'filled' | 'outlined' | 'tonal';
  selected?: boolean;
  disabled?: boolean;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
  onDelete?: () => void;
}

export const M3Chip = forwardRef<HTMLDivElement, M3ChipProps>(
  ({ 
    className, 
    variant = 'filled', 
    selected = false,
    disabled = false,
    avatar,
    icon,
    onDelete,
    children,
    ...props 
  }, ref) => {
    const variants = {
      filled: selected 
        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
        : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
      outlined: selected
        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
        : 'bg-transparent text-[var(--text-primary)] border-[var(--md-sys-color-outline)]',
      tonal: selected
        ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
        : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full',
          'text-sm font-medium',
          'transition-all duration-200',
          'cursor-pointer',
          'select-none',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80',
          variant === 'outlined' && 'border',
          variants[variant],
          className
        )}
        {...props}
      >
        {avatar && <div className="shrink-0">{avatar}</div>}
        {icon && <div className="shrink-0 text-lg">{icon}</div>}
        <span className="sentence-case">{children}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

M3Chip.displayName = 'M3Chip';

interface M3ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  selection?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export const M3ChipGroup = forwardRef<HTMLDivElement, M3ChipGroupProps>(
  ({ className, selection = 'multiple', value, onValueChange, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-wrap gap-2', className)} {...props}>
        {children}
      </div>
    );
  }
);

M3ChipGroup.displayName = 'M3ChipGroup';
