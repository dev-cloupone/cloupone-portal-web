import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../../stores/locale.store';

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export function LanguageToggle({ className = '', compact }: LanguageToggleProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const isEN = locale === 'en-US';

  const toggle = () => setLocale(isEN ? 'pt-BR' : 'en-US');
  const title = isEN ? t('common.switchToPortuguese') : t('common.switchToEnglish');

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted
                    hover:bg-surface-3 hover:text-text-secondary transition-colors ${className}`}
        title={title}
        aria-label={title}
      >
        <Languages size={15} />
        <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold leading-none text-text-muted">
          {isEN ? 'EN' : 'PT'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`flex h-8 items-center gap-1 rounded-full border border-border
                  px-3 text-xs font-medium transition-all hover:bg-surface-3 ${className}`}
      title={title}
      aria-label={title}
    >
      <span className={isEN ? 'text-text-muted' : 'text-text font-semibold'}>PT</span>
      <span className="text-text-muted">|</span>
      <span className={isEN ? 'text-text font-semibold' : 'text-text-muted'}>EN</span>
    </button>
  );
}
