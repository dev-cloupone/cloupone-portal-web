import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { DayGroup, TimeEntry } from '../../types/time-entry.types';

interface DayEntryListProps {
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

export function DayEntryList({ dayGroups, onEditEntry, onDeleteEntry, onAddEntry, isReadonly }: DayEntryListProps) {
  return (
    <div className="space-y-4">
      {dayGroups.map((day) => {
        const hasEntries = day.entries.length > 0;
        const isWeekend = ['Sab', 'Dom'].includes(day.dayLabel);

        return (
          <div key={day.date} className="rounded-xl border border-border bg-surface-1 overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/50">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${hasEntries ? 'bg-accent' : 'bg-text-muted/30'}`} />
                <span className="text-sm font-semibold text-text-primary">
                  {day.dayLabel} {day.dateFormatted}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${day.totalHours > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                  {day.totalHours > 0 ? `${day.totalHours.toFixed(1)}h` : '0h'}
                </span>
                {!hasEntries && !isWeekend && (
                  <AlertCircle size={14} className="text-warning" />
                )}
              </div>
            </div>

            {/* Entries */}
            <div className="divide-y divide-border/50">
              {day.entries.map((entry) => {
                const badge = statusBadge[entry.status];
                const isEditable = entry.status === 'draft' || entry.status === 'rejected';
                const isDeletable = entry.status === 'draft';

                return (
                  <div key={entry.id} className="px-4 py-2.5 hover:bg-surface-2/30 transition-colors">
                    {/* Rejection banner */}
                    {entry.status === 'rejected' && entry.rejectionComment && (
                      <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-danger mb-0.5">Rejeitado</p>
                        <p className="text-xs text-text-primary">{entry.rejectionComment}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Time range */}
                      <span className="text-sm font-mono font-semibold text-text-primary whitespace-nowrap min-w-[100px]">
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </span>

                      {/* Project + client */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {entry.projectName}
                          </span>
                          {entry.clientName && (
                            <span className="text-xs text-text-muted truncate hidden sm:inline">
                              {entry.clientName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          {entry.categoryName && <span>{entry.categoryName}</span>}
                          {entry.ticketCode && (
                            <>
                              {entry.categoryName && <span>·</span>}
                              <span>{entry.ticketCode}</span>
                            </>
                          )}
                          {entry.description && (
                            <>
                              {(entry.categoryName || entry.ticketCode) && <span>·</span>}
                              <span className="truncate max-w-[200px]" title={entry.description}>
                                {entry.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Hours */}
                      <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                        {Number(entry.hours).toFixed(1)}h
                      </span>

                      {/* Status badge */}
                      {entry.status !== 'draft' && (
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      )}

                      {/* Actions */}
                      {!isReadonly && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditable && (
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="rounded-md p-1.5 text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isDeletable && (
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              className="rounded-md p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add entry button */}
              {!isReadonly && (
                <div className="px-4 py-2">
                  <button
                    onClick={() => onAddEntry(day.date)}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    <Plus size={14} />
                    <span>Adicionar registro</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
