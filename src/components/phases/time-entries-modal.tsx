import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ProgressBar } from './progress-bar';
import * as phaseService from '../../services/phase.service';
import { formatApiError } from '../../services/api';
import type { PhaseTimeEntriesResponse, PhaseTimeEntryItem } from '../../types/phase.types';

interface ConsultantOption {
  userId: string;
  userName: string;
}

interface SubphaseOption {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  phaseId?: string;
  subphaseId?: string;
  consultants?: ConsultantOption[];
  subphases?: SubphaseOption[];
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function groupByDate(entries: PhaseTimeEntryItem[]): { date: string; items: PhaseTimeEntryItem[] }[] {
  const map = new Map<string, PhaseTimeEntryItem[]>();
  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export function TimeEntriesModal({ isOpen, onClose, title, phaseId, subphaseId, consultants = [], subphases = [] }: Props) {
  const [data, setData] = useState<PhaseTimeEntriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Filters
  const [filterUserId, setFilterUserId] = useState('');
  const [filterSubphaseId, setFilterSubphaseId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fetchData = useCallback(async () => {
    if (!phaseId && !subphaseId) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        userId: filterUserId || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
        subphaseId: filterSubphaseId || undefined,
      };

      const result = subphaseId
        ? await phaseService.getSubphaseTimeEntries(subphaseId, params)
        : await phaseService.getPhaseTimeEntries(phaseId!, params);

      setData(result);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [phaseId, subphaseId, page, filterUserId, filterSubphaseId, filterFrom, filterTo]);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setFilterUserId('');
      setFilterSubphaseId('');
      setFilterFrom('');
      setFilterTo('');
      setData(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  function handleFilterChange() {
    setPage(1);
  }

  const groups = data ? groupByDate(data.data) : [];
  const isPhaseLevel = !!phaseId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apontamentos — ${title}`} className="!max-w-2xl">
      <div className="space-y-4">
        {/* Summary */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
              <p className="text-xs text-text-tertiary">Estimado</p>
              <p className="text-sm font-semibold text-text-primary">{data.summary.estimatedHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
              <p className="text-xs text-text-tertiary">Realizado</p>
              <p className="text-sm font-semibold text-text-primary">{data.summary.actualHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
              <p className="text-xs text-text-tertiary">Progresso</p>
              <p className="text-sm font-semibold text-text-primary">{data.summary.percentComplete}%</p>
            </div>
          </div>
        )}

        {data && data.summary.estimatedHours > 0 && (
          <ProgressBar estimated={data.summary.estimatedHours} actual={data.summary.actualHours} />
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          {consultants.length > 0 && (
            <Select
              options={consultants.map(c => ({ value: c.userId, label: c.userName }))}
              value={filterUserId}
              onChange={(v) => { setFilterUserId(v); handleFilterChange(); }}
              placeholder="Todos os consultores"
            />
          )}
          {isPhaseLevel && subphases.length > 0 && (
            <Select
              options={subphases.map(s => ({ value: s.id, label: s.name }))}
              value={filterSubphaseId}
              onChange={(v) => { setFilterSubphaseId(v); handleFilterChange(); }}
              placeholder="Todas as subfases"
            />
          )}
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); handleFilterChange(); }}
            placeholder="De"
          />
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); handleFilterChange(); }}
            placeholder="Até"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <p className="text-sm text-text-tertiary text-center py-6">Carregando...</p>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">Nenhum apontamento encontrado</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.date}>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  {formatDate(group.date)}
                </p>
                <div className="space-y-1">
                  {group.items.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">{entry.userName}</span>
                          {isPhaseLevel && entry.subphaseName && (
                            <span className="text-xs text-text-tertiary bg-surface-3 rounded px-1.5 py-0.5 truncate">{entry.subphaseName}</span>
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-xs text-text-muted truncate mt-0.5">{entry.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-text-tertiary">{entry.startTime} — {entry.endTime}</p>
                        <p className="text-sm font-semibold text-text-primary">{Number(entry.hours).toFixed(1)}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} className="mr-1" /> Anterior
            </Button>
            <span className="text-xs text-text-tertiary">
              Página {data.meta.page} de {data.meta.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
