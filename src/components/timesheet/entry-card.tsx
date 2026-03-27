import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import type { TimeEntry } from '../../types/time-entry.types';

interface EntryCardProps {
  entry: TimeEntry;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-text-muted',
  submitted: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-danger',
  auto_approved: 'bg-success',
};

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

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const canEdit = entry.status === 'draft' || entry.status === 'rejected';
  const canDelete = entry.status === 'draft';

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-2 transition-colors hover:border-border-subtle">
      {/* Header: time range + status dot + duration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[entry.status]}`} />
          <span className="text-sm font-medium text-text-primary">
            {formatTimeRange(entry.startTime, entry.endTime)}
          </span>
        </div>
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

      {/* Rejection comment */}
      {entry.status === 'rejected' && entry.rejectionComment && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-danger" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-danger">Motivo da rejeicao</span>
          </div>
          <p className="text-xs text-text-primary">{entry.rejectionComment}</p>
        </div>
      )}

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
              <Pencil size={12} className="mr-1" /> Editar
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)} className="text-danger hover:text-danger-hover">
              <Trash2 size={12} className="mr-1" /> Excluir
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
