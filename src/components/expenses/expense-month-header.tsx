import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import type { ExpenseMonthData, ExpenseWeekSummary } from '../../types/expense.types';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

interface ExpenseMonthHeaderProps {
  currentMonthStr: string;
  monthData: ExpenseMonthData | null;
  selectedWeekSummary: ExpenseWeekSummary | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function formatMonthLabel(monthStr: string): string {
  const [yearStr, mStr] = monthStr.split('-');
  const date = new Date(parseInt(yearStr), parseInt(mStr) - 1, 1);
  const label = date.toLocaleDateString(useLocaleStore.getState().locale, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ExpenseMonthHeader({
  currentMonthStr,
  monthData,
  selectedWeekSummary,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: ExpenseMonthHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {t('expenses.expensesByProject')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label={t('common.previousMonth')}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {formatMonthLabel(currentMonthStr)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label={t('common.nextMonth')}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> {t('common.today')}
          </Button>
        </div>
      </div>

      {monthData && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
            <span className="text-text-tertiary text-xs">{t('expenses.totalMonthLabel')} </span>
            <span className="font-bold text-text-primary">{formatCurrency(monthData.totalAmount)}</span>
          </div>
          {selectedWeekSummary && (
            <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
              <span className="text-text-tertiary text-xs">{t('expenses.weekLabel')} </span>
              <span className="font-bold text-text-primary">{formatCurrency(selectedWeekSummary.totalAmount)}</span>
              <span className="text-text-muted text-xs ml-1">({t('expenses.expenseCountLabel', { count: selectedWeekSummary.expenseCount })})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
