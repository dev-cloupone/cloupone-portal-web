import { ExpenseCalendarCell } from './expense-calendar-cell';
import { ExpenseCalendarLegend } from './expense-calendar-legend';
import type { ExpenseCalendarDay } from '../../types/expense.types';

interface ExpenseMonthCalendarProps {
  calendarDays: ExpenseCalendarDay[];
  selectedDate: string | null;
  selectedWeekStart: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function isInSelectedWeek(dateStr: string, weekStartStr: string | null): boolean {
  if (!weekStartStr) return false;
  const d = new Date(dateStr + 'T12:00:00');
  const ws = new Date(weekStartStr + 'T12:00:00');
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  return d >= ws && d <= we;
}

export function ExpenseMonthCalendar({
  calendarDays,
  selectedDate,
  selectedWeekStart,
  onSelectDate,
}: ExpenseMonthCalendarProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface-1 p-2 sm:p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(day => (
            <div key={day} className="text-center text-caption text-text-tertiary py-1.5 font-semibold uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map(day => (
            <ExpenseCalendarCell
              key={day.date}
              date={day.date}
              dayNumber={day.dayNumber}
              isCurrentMonth={day.isCurrentMonth}
              isToday={day.isToday}
              isSelected={day.date === selectedDate}
              isSelectedWeek={isInSelectedWeek(day.date, selectedWeekStart)}
              isWeekend={day.isWeekend}
              periodStatus={day.periodStatus}
              totalAmount={day.totalAmount}
              expenses={day.expenses}
              onClick={onSelectDate}
            />
          ))}
        </div>
      </div>

      <ExpenseCalendarLegend />
    </div>
  );
}
