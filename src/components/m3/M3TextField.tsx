import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface M3TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const M3TextField = forwardRef<HTMLInputElement, M3TextFieldProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    disabled,
    ...props 
  }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-[var(--text-primary)] sentence-case">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border',
            'bg-[var(--bg-secondary)]',
            'text-[var(--text-primary)]',
            'text-base',
            'transition-all duration-200',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-[var(--md-sys-color-primary)]',
            'focus:border-transparent',
            'disabled:opacity-50',
            'disabled:cursor-not-allowed',
            error ? 'border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]' : 'border-[var(--border-primary)]',
            className
          )}
          disabled={disabled}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('text-xs', error ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--text-secondary)]')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

M3TextField.displayName = 'M3TextField';

interface M3TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const M3TextArea = forwardRef<HTMLTextAreaElement, M3TextAreaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    disabled,
    rows = 3,
    ...props 
  }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-[var(--text-primary)] sentence-case">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 rounded-lg border',
            'bg-[var(--bg-secondary)]',
            'text-[var(--text-primary)]',
            'text-base',
            'transition-all duration-200',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-[var(--md-sys-color-primary)]',
            'focus:border-transparent',
            'disabled:opacity-50',
            'disabled:cursor-not-allowed',
            'resize-none',
            error ? 'border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]' : 'border-[var(--border-primary)]',
            className
          )}
          disabled={disabled}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('text-xs', error ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--text-secondary)]')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

M3TextArea.displayName = 'M3TextArea';
