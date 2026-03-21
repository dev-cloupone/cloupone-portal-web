import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-3 text-text-secondary border-border',
  success: 'bg-success-muted text-accent border-accent/20',
  warning: 'bg-warning-muted text-warning border-warning/20',
  danger: 'bg-danger-muted text-danger border-danger/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
