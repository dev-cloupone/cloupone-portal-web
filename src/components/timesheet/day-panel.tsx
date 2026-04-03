import { Plus, Clock, X } from 'lucide-react';
import { Button } from '../ui/button';
import { EntryCard } from './entry-card';
import type { TimeEntry, WeekSummary } from '../../types/time-entry.types';

interface DayPanelProps {
  selectedDate: string;
  entries: TimeEntry[];
  weekSummary: WeekSummary | null;
  isEditable?: boolean;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
  onNewEntry: () => void;
  onClose: () => void;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const formatted = d.toLocaleDateString('pt-BR', {
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
  weekSummary,
  isEditable = true,
  onEdit,
  onDelete,
  onNewEntry,
  onClose,
}: DayPanelProps) {
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
                <Plus size={14} className="mr-1" /> Novo Apontamento
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-0.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              aria-label="Fechar painel e voltar ao resumo mensal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Week info bar */}
        {weekSummary && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              Semana: {formatHoursLabel(weekSummary.totalHours)} / {weekSummary.targetHours}h
            </span>
          </div>
        )}
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
          <p className="text-sm text-text-tertiary mb-1">Nenhum apontamento</p>
          {isEditable ? (
            <p className="text-xs text-text-muted">Use o botão acima para registrar suas horas</p>
          ) : (
            <p className="text-xs text-text-muted">Este mes ja foi aprovado e nao permite novos apontamentos.</p>
          )}
        </div>
      )}

    </div>
  );
}
