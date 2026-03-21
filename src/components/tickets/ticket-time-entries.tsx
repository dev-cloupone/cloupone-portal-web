import { Clock } from 'lucide-react';

interface TimeEntryRow {
  id: string;
  userName?: string;
  date: string;
  hours: number;
  description?: string;
}

interface TicketTimeEntriesProps {
  entries: TimeEntryRow[];
  estimatedHours: number | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function TicketTimeEntries({ entries, estimatedHours }: TicketTimeEntriesProps) {
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const percentage = estimatedHours ? Math.min((totalHours / estimatedHours) * 100, 100) : 0;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Horas Registradas</h4>

      {estimatedHours != null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">
              {totalHours.toFixed(1)}h / {estimatedHours}h estimadas
            </span>
            <span className="text-text-muted">{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentage > 100 ? 'bg-danger' : percentage > 80 ? 'bg-warning' : 'bg-accent'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!estimatedHours && entries.length > 0 && (
        <p className="text-xs text-text-muted">
          Total: {totalHours.toFixed(1)}h
        </p>
      )}

      {entries.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-text-muted py-2">
          <Clock size={14} />
          Nenhuma hora registrada
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-xs">
              <span className="text-text-muted shrink-0">{formatDate(entry.date)}</span>
              <span className="font-medium text-text-primary shrink-0">{entry.hours.toFixed(1)}h</span>
              {entry.userName && (
                <span className="text-text-muted truncate">{entry.userName}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
