import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface M3CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const M3Card = forwardRef<HTMLDivElement, M3CardProps>(
  ({ 
    className, 
    variant = 'elevated', 
    padding = 'medium',
    children,
    ...props 
  }, ref) => {
    const variants = {
      elevated: 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]',
      filled: 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]',
      outlined: 'bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)]',
    };
    
    const paddings = {
      none: '',
      small: 'p-3',
      medium: 'p-4',
      large: 'p-6',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

M3Card.displayName = 'M3Card';

interface M3CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const M3CardHeader = forwardRef<HTMLDivElement, M3CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mb-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

M3CardHeader.displayName = 'M3CardHeader';

interface M3CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const M3CardTitle = forwardRef<HTMLHeadingElement, M3CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn('text-lg font-semibold text-[var(--text-primary)] sentence-case', className)} {...props}>
        {children}
      </h3>
    );
  }
);

M3CardTitle.displayName = 'M3CardTitle';

interface M3CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const M3CardDescription = forwardRef<HTMLParagraphElement, M3CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm text-[var(--text-secondary)] sentence-case', className)} {...props}>
        {children}
      </p>
    );
  }
);

M3CardDescription.displayName = 'M3CardDescription';

interface M3CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const M3CardContent = forwardRef<HTMLDivElement, M3CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

M3CardContent.displayName = 'M3CardContent';

interface M3CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const M3CardFooter = forwardRef<HTMLDivElement, M3CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mt-4 flex items-center gap-2', className)} {...props}>
        {children}
      </div>
    );
  }
);

M3CardFooter.displayName = 'M3CardFooter';
