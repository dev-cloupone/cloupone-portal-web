import { type InputHTMLAttributes, forwardRef } from 'react';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={`block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger whitespace-pre-line">{error}</p>}
      </div>
    );
  }
);
