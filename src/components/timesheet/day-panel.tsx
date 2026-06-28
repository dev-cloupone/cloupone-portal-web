import { Plus, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { EntryCard } from './entry-card';
import { useLocaleStore } from '../../stores/locale.store';
import type { TimeEntry } from '../../types/time-entry.types';

interface DayPanelProps {
  selectedDate: string;
  entries: TimeEntry[];
  isEditable?: boolean;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
  onNewEntry: () => void;
  onClose: () => void;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const formatted = d.toLocaleDateString(useLocaleStore.getState().locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatHoursLabel(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function DayPanel({
  selectedDate,
  entries,
  isEditable = true,
  onEdit,
  onDelete,
  onNewEntry,
  onClose,
}: DayPanelProps) {
  const { t } = useTranslation();
  const dayTotal = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-4 animate-slide-in-right">
      {/* Day header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {formatDayHeader(selectedDate)}
          </h3>
          <div className="flex items-center gap-2">
            {dayTotal > 0 && (
              <span className="text-sm font-bold text-text-primary">
                {formatHoursLabel(dayTotal)}
              </span>
            )}
            {isEditable && (
              <Button variant="secondary" size="sm" onClick={onNewEntry}>
                <Plus size={14} className="mr-1" /> {t('timesheet.newEntry')}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-0.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              aria-label={t('timesheet.closePanelLabel')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Entries list */}
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isEditable={isEditable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock size={32} className="text-text-muted mb-3" />
          <p className="text-sm text-text-tertiary mb-1">{t('timesheet.noEntries')}</p>
          {isEditable ? (
            <p className="text-xs text-text-muted">{t('timesheet.useButtonAbove')}</p>
          ) : (
            <p className="text-xs text-text-muted">{t('timesheet.monthApproved')}</p>
          )}
        </div>
      )}

    </div>
  );
}
