import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className={`group relative flex h-8 w-[60px] items-center rounded-full border border-border p-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 to-sky-50 hover:from-amber-100 hover:to-sky-100'
          : 'bg-surface-3 hover:bg-surface-4'
      } ${className}`}
      title={isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
      aria-label={isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
    >
      {/* Sliding pill indicator */}
      <span
        className={`absolute top-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isLight
            ? 'left-[calc(100%-28px)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)]'
            : 'left-[2px] bg-surface-1 shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
        }`}
      >
        {isLight ? (
          <Sun
            size={14}
            className="text-amber-500 transition-transform duration-300 group-hover:rotate-45"
          />
        ) : (
          <Moon
            size={14}
            className="text-indigo-300 transition-transform duration-300 group-hover:-rotate-12"
          />
        )}
      </span>

      {/* Background icons (subtle, behind the pill) */}
      <span className="flex w-full items-center justify-between px-[7px]">
        <Sun
          size={12}
          className={`transition-opacity duration-300 ${
            isLight ? 'opacity-0' : 'opacity-20 text-text-muted'
          }`}
        />
        <Moon
          size={12}
          className={`transition-opacity duration-300 ${
            isLight ? 'opacity-20 text-text-muted' : 'opacity-0'
          }`}
        />
      </span>
    </button>
  );
}
