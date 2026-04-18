import { ArrowLeft } from 'lucide-react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import type { MonthlyTimesheet } from '../../types/monthly-timesheet.types';
import type { TimeEntry } from '../../types/time-entry.types';

interface MonthDetailProps {
  timesheet: MonthlyTimesheet;
  entries: TimeEntry[];
  isLoading: boolean;
  onBack: () => void;
  onApprove: () => void;
  onReopen: () => void;
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { label: 'Aberto', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  reopened: { label: 'Reaberto', variant: 'default' },
};

const dayNames: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab',
};

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${dayNames[d.getDay()]}`;
}

export function MonthDetail({ timesheet, entries, isLoading, onBack, onApprove, onReopen }: MonthDetailProps) {
  const sortedEntries = [...entries].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  const totalHours = sortedEntries.reduce((sum, e) => sum + Number(e.hours), 0);
  const statusCfg = STATUS_CONFIG[timesheet.status] ?? STATUS_CONFIG.open;
  const canApprove = timesheet.status === 'open' || timesheet.status === 'reopened';
  const canReopen = timesheet.status === 'approved';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary">
                {timesheet.consultantName ?? 'Consultor'}
              </h3>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              {timesheet.escalatedAt && <Badge variant="warning">Escalonado</Badge>}
            </div>
            <p className="text-sm text-text-secondary">
              {MONTH_NAMES[timesheet.month]}/{timesheet.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
            <Button size="sm" onClick={onApprove}>
              Aprovar mês
            </Button>
          )}
          {canReopen && (
            <Button size="sm" variant="ghost" onClick={onReopen}>
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {/* Reopen reason */}
      {timesheet.status === 'reopened' && timesheet.reopenReason && (
        <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2">
          <p className="text-xs text-text-secondary">
            <strong>Motivo da reabertura:</strong> {timesheet.reopenReason}
          </p>
        </div>
      )}

      {/* Entries table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-12">
          <p className="text-text-muted text-sm">Nenhum apontamento neste mes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Data</TableHeader>
                <TableHeader>Horario</TableHeader>
                <TableHeader>Projeto</TableHeader>
                <TableHeader>Categoria</TableHeader>
                <TableHeader className="text-right">Horas</TableHeader>
                <TableHeader>Descrição</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatEntryDate(entry.date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-sm">
                    {entry.startTime?.slice(0, 5)}-{entry.endTime?.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div>{entry.projectName || '-'}</div>
                    {entry.clientName && (
                      <div className="text-xs text-text-muted">{entry.clientName}</div>
                    )}
                  </TableCell>
                  <TableCell>{entry.categoryName || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(entry.hours).toFixed(1)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.description || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      {sortedEntries.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-text-secondary">
            Total:{' '}
            <span className="font-semibold text-text-primary">{totalHours.toFixed(1)}h</span>
            {' \u00b7 '}
            {sortedEntries.length} apontamento{sortedEntries.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {canApprove && (
              <Button size="sm" onClick={onApprove}>
                Aprovar mês
              </Button>
            )}
            {canReopen && (
              <Button size="sm" variant="ghost" onClick={onReopen}>
                Reabrir
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
