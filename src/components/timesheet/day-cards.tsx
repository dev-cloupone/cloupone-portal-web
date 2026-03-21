import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { DayGroup, TimeEntry } from '../../types/time-entry.types';

interface DayCardsProps {
  dayGroups: DayGroup[];
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddEntry: (date: string) => void;
  isReadonly: boolean;
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  submitted: { label: 'Submetido', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'danger' },
};

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function DayCards({ dayGroups, onEditEntry, onDeleteEntry, onAddEntry, isReadonly }: DayCardsProps) {
  const [dayIndex, setDayIndex] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const idx = dayGroups.findIndex((g) => g.date === today);
    return idx >= 0 ? idx : 0;
  });

  const day = dayGroups[dayIndex];
  if (!day) return null;

  function goPrev() {
    setDayIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setDayIndex((i) => Math.min(dayGroups.length - 1, i + 1));
  }

  return (
    <div className="space-y-3">
      {/* Day navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goPrev} disabled={dayIndex === 0}>
          <ChevronLeft size={16} />
        </Button>
        <div className="text-center">
          <div className="text-sm font-semibold text-text-primary">{day.dayLabel}</div>
          <div className="text-xs text-text-muted">{day.dateFormatted}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={goNext} disabled={dayIndex === dayGroups.length - 1}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Day total */}
      <div className="text-center text-xs text-text-tertiary">
        Total do dia: <span className="font-semibold text-text-primary">{day.totalHours.toFixed(1)}h</span>
      </div>

      {/* Entry cards */}
      {day.entries.length === 0 && (
        <div className="rounded-xl border border-border bg-surface-1 px-4 py-8 text-center text-sm text-text-muted">
          Nenhum registro neste dia.
        </div>
      )}

      {day.entries.map((entry) => {
        const badge = statusBadge[entry.status];
        const isEditable = entry.status === 'draft' || entry.status === 'rejected';
        const isDeletable = entry.status === 'draft';

        return (
          <div
            key={entry.id}
            className="rounded-xl border border-border bg-surface-1 p-4 space-y-2"
          >
            {/* Rejection banner */}
            {entry.status === 'rejected' && entry.rejectionComment && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-danger mb-0.5">Rejeitado</p>
                <p className="text-xs text-text-primary">{entry.rejectionComment}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-semibold text-text-primary text-sm">
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </div>
                <div className="font-medium text-text-primary text-sm mt-0.5">{entry.projectName}</div>
                {entry.clientName && <div className="text-xs text-text-muted">{entry.clientName}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">{Number(entry.hours).toFixed(1)}h</span>
                {entry.status !== 'draft' && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </div>
            </div>

            {(entry.categoryName || entry.ticketCode) && (
              <div className="text-xs text-text-muted flex items-center gap-2">
                {entry.categoryName && <span>{entry.categoryName}</span>}
                {entry.ticketCode && <span>{entry.ticketCode}</span>}
              </div>
            )}

            {entry.description && (
              <p className="text-xs text-text-muted line-clamp-2">{entry.description}</p>
            )}

            {!isReadonly && (isEditable || isDeletable) && (
              <div className="flex gap-2 pt-1">
                {isEditable && (
                  <Button variant="ghost" size="sm" onClick={() => onEditEntry(entry)}>
                    <Pencil size={14} className="mr-1" /> Editar
                  </Button>
                )}
                {isDeletable && (
                  <Button variant="ghost" size="sm" onClick={() => onDeleteEntry(entry.id)}>
                    <Trash2 size={14} className="mr-1" /> Remover
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add entry */}
      {!isReadonly && (
        <Button variant="secondary" className="w-full" onClick={() => onAddEntry(day.date)}>
          <Plus size={14} className="mr-1" /> Novo Registro
        </Button>
      )}
    </div>
  );
}
