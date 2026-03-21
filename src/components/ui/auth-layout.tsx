import { type ReactNode, useState, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { getPublicSettings } from '../../services/public-settings';

interface AuthLayoutProps {
  children: ReactNode;
  subtitle?: string;
}

export function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  const [appName, setAppName] = useState('Cloup One');

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (settings.app_name) setAppName(settings.app_name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="auth-gradient noise flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative arcs */}
      <div className="decorative-arcs" />

      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-[1]">
        {/* Brand logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/cloup-one-brand.svg"
            alt={appName}
            className="h-14 w-auto mb-4 brand-logo-shadow"
          />
          {subtitle && (
            <p className="text-sm text-white/70">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-surface-1/80 backdrop-blur-xl p-7 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
