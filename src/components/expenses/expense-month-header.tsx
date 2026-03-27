import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import type { ExpenseMonthData, ExpenseWeekSummary } from '../../types/expense.types';

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
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseMonthHeader({
  currentMonthStr,
  monthData,
  selectedWeekSummary,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: ExpenseMonthHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Despesas por Projeto
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {formatMonthLabel(currentMonthStr)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Proximo mes">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> Hoje
          </Button>
        </div>
      </div>

      {monthData && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
            <span className="text-text-tertiary text-xs">Total mês: </span>
            <span className="font-bold text-text-primary">{formatCurrency(monthData.totalAmount)}</span>
          </div>
          {selectedWeekSummary && (
            <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
              <span className="text-text-tertiary text-xs">Semana: </span>
              <span className="font-bold text-text-primary">{formatCurrency(selectedWeekSummary.totalAmount)}</span>
              <span className="text-text-muted text-xs ml-1">({selectedWeekSummary.expenseCount} despesa{selectedWeekSummary.expenseCount !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
