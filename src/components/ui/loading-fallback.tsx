import { useTranslation } from 'react-i18next';

export function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex h-dvh items-center justify-center bg-surface-0">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="h-2.5 w-2.5 rounded-full bg-accent animate-glow-pulse" />
        <span className="text-xs text-text-tertiary">{t('common.loading')}</span>
      </div>
    </div>
  );
}
