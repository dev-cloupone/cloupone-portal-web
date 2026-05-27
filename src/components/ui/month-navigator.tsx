import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface MonthNavigatorProps {
  currentMonth: string; // "yyyy-MM"
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthNavigator({ currentMonth, onPreviousMonth, onNextMonth, onToday }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label="Mês anterior">
        <ChevronLeft size={16} />
      </Button>
      <h1 className="text-lg font-semibold text-text-primary capitalize min-w-[160px] text-center">
        {formatMonthLabel(currentMonth)}
      </h1>
      <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Próximo mês">
        <ChevronRight size={16} />
      </Button>
      <Button variant="secondary" size="sm" onClick={onToday}>Hoje</Button>
    </div>
  );
}
