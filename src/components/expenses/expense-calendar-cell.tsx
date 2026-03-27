import type { Expense } from '../../types/expense.types';

interface ExpenseCalendarCellProps {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isSelectedWeek: boolean;
  isWeekend: boolean;
  totalAmount: number;
  expenses: Expense[];
  onClick: (date: string) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-text-muted',
  submitted: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-danger',
};

export function ExpenseCalendarCell({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  isSelected,
  isSelectedWeek,
  isWeekend,
  totalAmount,
  expenses,
  onClick,
}: ExpenseCalendarCellProps) {
  let bgClass = 'bg-surface-1';
  if (isSelected) bgClass = 'bg-accent-10';
  else if (isSelectedWeek) bgClass = 'bg-accent-5';
  else if (isWeekend) bgClass = 'bg-[var(--color-weekend)]';

  let borderClass = 'border border-transparent';
  if (isSelected) borderClass = 'border border-accent';
  else if (isToday) borderClass = 'border border-dashed border-accent/50';

  let dayTextClass = 'text-text-primary';
  if (!isCurrentMonth) dayTextClass = 'text-text-muted';
  else if (isSelected) dayTextClass = 'text-accent font-bold';
  else if (isToday) dayTextClass = 'text-accent';

  const dots = expenses.slice(0, 5);

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className={`relative flex flex-col items-start p-1.5 sm:p-2 rounded-lg min-h-[52px] sm:min-h-[68px] transition-all duration-150 cursor-pointer hover:bg-accent-10 ${bgClass} ${borderClass}`}
    >
      <span className={`text-xs sm:text-sm leading-none ${dayTextClass}`}>
        {dayNumber}
      </span>

      {totalAmount > 0 && (
        <span className="text-[10px] sm:text-xs font-medium mt-0.5 text-text-secondary">
          {formatCurrency(totalAmount)}
        </span>
      )}

      {dots.length > 0 && (
        <div className="flex gap-0.5 mt-auto pt-0.5">
          {dots.map((expense, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[expense.status] ?? 'bg-text-muted'}`}
            />
          ))}
        </div>
      )}
    </button>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`;
  return `R$${value.toFixed(0)}`;
}
