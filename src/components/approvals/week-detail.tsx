import { useState } from 'react';
import { Check, X, CheckCheck, MessageSquare } from 'lucide-react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import type { TimeEntry } from '../../types/time-entry.types';

type PendingEntry = TimeEntry & { userName?: string; userEmail?: string };

interface WeekDetailProps {
  entries: PendingEntry[];
  onApproveAll: (entryIds: string[]) => Promise<void>;
  onReject: (entryId: string, comment: string) => Promise<void>;
}

const dayNames: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
};

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${dayNames[d.getDay()]}`;
}

export function WeekDetail({ entries, onApproveAll, onReject }: WeekDetailProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedEntries = [...entries].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  const totalHours = sortedEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  async function handleApproveAll() {
    setLoading(true);
    setError('');
    try {
      await onApproveAll(sortedEntries.map((e) => e.id));
    } catch (err) {
      setError((err as Error).message || 'Erro ao aprovar');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveOne(entryId: string) {
    setLoading(true);
    setError('');
    try {
      await onApproveAll([entryId]);
    } catch (err) {
      setError((err as Error).message || 'Erro ao aprovar');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectingId || !rejectComment.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onReject(rejectingId, rejectComment);
      setRejectingId(null);
      setRejectComment('');
    } catch (err) {
      setError((err as Error).message || 'Erro ao rejeitar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Data</TableHeader>
              <TableHeader>Horário</TableHeader>
              <TableHeader>Projeto</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader className="text-right">Horas</TableHeader>
              <TableHeader>Descricao</TableHeader>
              <TableHeader className="w-24">Acoes</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatEntryDate(entry.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-sm">
                  {entry.startTime?.slice(0, 5)}–{entry.endTime?.slice(0, 5)}
                </TableCell>
                <TableCell>
                  <div>{entry.projectName || '—'}</div>
                  {entry.clientName && (
                    <div className="text-xs text-text-muted">{entry.clientName}</div>
                  )}
                </TableCell>
                <TableCell>{entry.categoryName || '—'}</TableCell>
                <TableCell className="text-right font-mono">
                  {Number(entry.hours).toFixed(1)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {entry.description || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApproveOne(entry.id)}
                      disabled={loading}
                      className="rounded-md p-1.5 text-accent hover:bg-success-muted transition-colors disabled:opacity-50"
                      title="Aprovar"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(entry.id);
                        setRejectComment('');
                        setError('');
                      }}
                      disabled={loading}
                      className="rounded-md p-1.5 text-danger hover:bg-danger-muted transition-colors disabled:opacity-50"
                      title="Rejeitar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-text-secondary">
          Total:{' '}
          <span className="font-semibold text-text-primary">{totalHours.toFixed(1)}h</span>
          {' · '}
          {sortedEntries.length} apontamento{sortedEntries.length !== 1 ? 's' : ''}
        </span>
        <Button onClick={handleApproveAll} disabled={loading} size="sm">
          <CheckCheck size={15} className="mr-1.5" /> Aprovar Tudo
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title="Rejeitar Apontamento"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Informe o motivo da rejeicao. O consultor sera notificado e podera corrigir o
            apontamento.
          </p>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Comentario
            </label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo da rejeicao..."
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setRejectingId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={loading || !rejectComment.trim()}
            >
              <MessageSquare size={15} className="mr-1.5" /> Rejeitar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
