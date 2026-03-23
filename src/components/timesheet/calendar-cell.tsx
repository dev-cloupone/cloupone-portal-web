import type { TimeEntry } from '../../types/time-entry.types';

interface CalendarCellProps {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isSelectedWeek: boolean;
  isWeekend: boolean;
  totalHours: number;
  entries: TimeEntry[];
  onClick: (date: string) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-text-muted',
  submitted: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-danger',
};

export function CalendarCell({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  isSelected,
  isSelectedWeek,
  isWeekend,
  totalHours,
  entries,
  onClick,
}: CalendarCellProps) {
  // Background
  let bgClass = 'bg-surface-1';
  if (isSelected) bgClass = 'bg-accent-10';
  else if (isSelectedWeek) bgClass = 'bg-accent-5';
  else if (isWeekend) bgClass = 'bg-[var(--color-weekend)]';

  // Border
  let borderClass = 'border border-transparent';
  if (isSelected) borderClass = 'border border-accent';
  else if (isToday) borderClass = 'border border-dashed border-accent/50';

  // Day number text
  let dayTextClass = 'text-text-primary';
  if (!isCurrentMonth) dayTextClass = 'text-text-muted';
  else if (isSelected) dayTextClass = 'text-accent font-bold';
  else if (isToday) dayTextClass = 'text-accent';

  // Hours color
  let hoursClass = 'text-text-tertiary';
  if (totalHours >= 8) hoursClass = 'text-success';
  else if (totalHours > 0) hoursClass = 'text-warning';

  // Limit dots to 5
  const dots = entries.slice(0, 5);

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className={`relative flex flex-col items-start p-1.5 sm:p-2 rounded-lg min-h-[52px] sm:min-h-[68px] transition-all duration-150 cursor-pointer hover:bg-accent-10 ${bgClass} ${borderClass}`}
    >
      <span className={`text-xs sm:text-sm leading-none ${dayTextClass}`}>
        {dayNumber}
      </span>

      {totalHours > 0 && (
        <span className={`text-[10px] sm:text-xs font-medium mt-0.5 ${hoursClass}`}>
          {formatHours(totalHours)}
        </span>
      )}

      {dots.length > 0 && (
        <div className="flex gap-0.5 mt-auto pt-0.5">
          {dots.map((entry, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[entry.status] ?? 'bg-text-muted'}`}
            />
          ))}
        </div>
      )}
    </button>
  );
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
