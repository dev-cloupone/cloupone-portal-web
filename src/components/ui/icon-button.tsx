import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'danger';
}

const variantClasses = {
  ghost: 'text-text-muted hover:bg-surface-3 hover:text-text-secondary',
  danger: 'text-text-muted hover:bg-danger-muted hover:text-danger',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none after:absolute after:-inset-1.5 after:content-[''] md:after:hidden ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
