import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { TimeEntry } from '../../types/time-entry.types';

interface EntryCardProps {
  entry: TimeEntry;
  isEditable?: boolean;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
}

function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

function formatDuration(hours: number | string): string {
  const h = Number(hours);
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  if (hrs === 0) return `${mins}min`;
  return `${hrs}h ${mins}min`;
}

export function EntryCard({ entry, isEditable = true, onEdit, onDelete }: EntryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-2 transition-colors hover:border-border-subtle">
      {/* Header: time range + duration */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {formatTimeRange(entry.startTime, entry.endTime)}
        </span>
        <span className="text-xs font-semibold text-text-secondary">
          {formatDuration(entry.hours)}
        </span>
      </div>

      {/* Project + Client */}
      <div>
        <p className="text-sm font-medium text-text-primary">{entry.projectName}</p>
        {(entry.clientName || entry.categoryName) && (
          <p className="text-xs text-text-tertiary">
            {[entry.clientName, entry.categoryName].filter(Boolean).join(' \u00b7 ')}
          </p>
        )}
      </div>

      {/* Ticket */}
      {entry.ticketCode && (
        <p className="text-xs text-text-tertiary">
          {entry.ticketCode}{entry.ticketTitle ? ` \u00b7 ${entry.ticketTitle}` : ''}
        </p>
      )}

      {/* Description */}
      {entry.description && (
        <p className="text-xs text-text-muted line-clamp-2">{entry.description}</p>
      )}

      {/* Actions */}
      {isEditable && (
        <div className="flex items-center gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
            <Pencil size={12} className="mr-1" /> Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)} className="text-danger hover:text-danger-hover">
            <Trash2 size={12} className="mr-1" /> Excluir
          </Button>
        </div>
      )}
    </div>
  );
}
