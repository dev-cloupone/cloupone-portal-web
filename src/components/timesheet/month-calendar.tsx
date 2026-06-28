import { useTranslation } from 'react-i18next';
import { CalendarCell } from './calendar-cell';
import type { CalendarDay } from '../../types/time-entry.types';

interface MonthCalendarProps {
  calendarDays: CalendarDay[];
  selectedDate: string | null;
  selectedWeekStart: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_HEADER_KEYS = [
  'timesheet.dayHeaders.mon', 'timesheet.dayHeaders.tue', 'timesheet.dayHeaders.wed',
  'timesheet.dayHeaders.thu', 'timesheet.dayHeaders.fri', 'timesheet.dayHeaders.sat',
  'timesheet.dayHeaders.sun',
];

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
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-2 sm:p-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADER_KEYS.map(key => (
          <div key={key} className="text-center text-caption text-text-tertiary py-1.5 font-semibold uppercase tracking-wider">
            {t(key)}
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
  );
}
