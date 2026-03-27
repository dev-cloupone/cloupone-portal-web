import { CalendarCell } from './calendar-cell';
import type { CalendarDay } from '../../types/time-entry.types';

interface MonthCalendarProps {
  calendarDays: CalendarDay[];
  selectedDate: string | null;
  selectedWeekStart: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

function isInSelectedWeek(dateStr: string, weekStartStr: string | null): boolean {
  if (!weekStartStr) return false;
  const d = new Date(dateStr + 'T12:00:00');
  const ws = new Date(weekStartStr + 'T12:00:00');
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  return d >= ws && d <= we;
}

export function MonthCalendar({
  calendarDays,
  selectedDate,
  selectedWeekStart,
  onSelectDate,
}: MonthCalendarProps) {
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
            <CalendarCell
              key={day.date}
              date={day.date}
              dayNumber={day.dayNumber}
              isCurrentMonth={day.isCurrentMonth}
              isToday={day.isToday}
              isSelected={day.date === selectedDate}
              isSelectedWeek={isInSelectedWeek(day.date, selectedWeekStart)}
              isWeekend={day.isWeekend}
              totalHours={day.totalHours}
              entries={day.entries}
              onClick={onSelectDate}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-caption text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-text-muted" /> Rascunho
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-warning" /> Submetido
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" /> Aprovado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" /> Auto-aprovado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-danger" /> Rejeitado
        </span>
      </div>
    </div>
  );
}
