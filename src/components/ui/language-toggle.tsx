import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '../../stores/locale.store';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const isEN = locale === 'en-US';

  return (
    <button
      onClick={() => setLocale(isEN ? 'pt-BR' : 'en-US')}
      className={`flex h-8 items-center gap-1 rounded-full border border-border
                  px-3 text-xs font-medium transition-all hover:bg-surface-3 ${className}`}
      title={isEN ? t('common.switchToPortuguese') : t('common.switchToEnglish')}
      aria-label={isEN ? t('common.switchToPortuguese') : t('common.switchToEnglish')}
    >
      <span className={isEN ? 'text-text-muted' : 'text-text font-semibold'}>PT</span>
      <span className="text-text-muted">|</span>
      <span className={isEN ? 'text-text font-semibold' : 'text-text-muted'}>EN</span>
    </button>
  );
}
