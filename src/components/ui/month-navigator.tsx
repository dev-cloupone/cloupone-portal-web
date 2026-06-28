import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { useLocaleStore } from '../../stores/locale.store';

interface MonthNavigatorProps {
  currentMonth: string; // "yyyy-MM"
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString(useLocaleStore.getState().locale, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthNavigator({ currentMonth, onPreviousMonth, onNextMonth, onToday }: MonthNavigatorProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label={t('common.previousMonth')}>
        <ChevronLeft size={16} />
      </Button>
      <h1 className="text-lg font-semibold text-text-primary capitalize min-w-[160px] text-center">
        {formatMonthLabel(currentMonth)}
      </h1>
      <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label={t('common.nextMonth')}>
        <ChevronRight size={16} />
      </Button>
      <Button variant="secondary" size="sm" onClick={onToday}>{t('common.today')}</Button>
    </div>
  );
}
