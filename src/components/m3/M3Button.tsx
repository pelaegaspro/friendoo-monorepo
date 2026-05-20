import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface M3ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export const M3Button = forwardRef<HTMLButtonElement, M3ButtonProps>(
  ({ 
    className, 
    variant = 'filled', 
    size = 'medium', 
    fullWidth = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      filled: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] hover:bg-[var(--friendoo-primary-variant)]',
      tonal: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:bg-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-secondary)]',
      outlined: 'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)]',
      text: 'bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)]',
    };
    
    const sizes = {
      small: 'h-8 px-3 text-xs',
      medium: 'h-10 px-4 text-sm',
      large: 'h-12 px-6 text-base',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          'rounded-full',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

M3Button.displayName = 'M3Button';
