import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { CalendarPlus, Lock, LockOpen, Tags } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import * as periodService from '../../services/project-expense-period.service';
import { formatApiError } from '../../services/api';
import type { ProjectExpensePeriod } from '../../types/expense.types';

interface Props {
  projectId: string;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateBR(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getSundayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const start = new Date(weekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function ProjectExpensePeriodsConfig({ projectId }: Props) {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<ProjectExpensePeriod[]>([]);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Open period form
  const [weekStartInput, setWeekStartInput] = useState('');
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const result = await periodService.listByProject(projectId);
      setPeriods(result.data);
    } catch {
      setError('Erro ao carregar períodos');
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // When user picks a date, snap to the Sunday of that week
  const resolvedWeekStart = weekStartInput ? getSundayOfWeek(weekStartInput) : '';
  const weekDays = resolvedWeekStart ? getWeekDays(resolvedWeekStart) : [];

  function openCreateModal() {
    setWeekStartInput('');
    setUseCustomDays(false);
    setSelectedDays(new Set());
    setError('');
    setIsOpenModalOpen(true);
  }

  function toggleDay(day: string) {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleOpenPeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedWeekStart) return;
    setError('');
    try {
      const customDays = useCustomDays && selectedDays.size > 0 ? Array.from(selectedDays).sort() : undefined;
      await periodService.openPeriod(projectId, { weekStart: resolvedWeekStart, customDays });
      setIsOpenModalOpen(false);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleClosePeriod(period: ProjectExpensePeriod) {
    if (!confirm(`Fechar o período ${formatDateBR(period.weekStart)} — ${formatDateBR(period.weekEnd)}?`)) return;
    try {
      await periodService.closePeriod(projectId, period.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleReopenPeriod(period: ProjectExpensePeriod) {
    if (!confirm(`Reabrir o período ${formatDateBR(period.weekStart)} — ${formatDateBR(period.weekEnd)}? Consultores poderão lançar despesas novamente.`)) return;
    try {
      await periodService.reopenPeriod(projectId, period.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const openPeriods = periods.filter(p => p.status === 'open');
  const closedPeriods = periods.filter(p => p.status === 'closed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Períodos Semanais</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/projects/${projectId}/expense-categories`)}>
            <Tags size={14} className="mr-1.5" /> Categorias
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <CalendarPlus size={14} className="mr-1.5" /> Abrir Semana
          </Button>
        </div>
      </div>

      {error && !isOpenModalOpen && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {periods.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">
          Nenhum período criado. Abra uma semana para permitir lançamento de despesas.
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Semana</TableHeader>
              <TableHeader>Dias</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...openPeriods, ...closedPeriods].map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {formatDateBR(p.weekStart)} — {formatDateBR(p.weekEnd)}
                </TableCell>
                <TableCell>
                  {p.customDays ? (
                    <span className="text-xs text-text-tertiary">{p.customDays.length} dias</span>
                  ) : (
                    <span className="text-xs text-text-tertiary">7 dias</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === 'open' ? 'success' : 'default'}>
                    {p.status === 'open' ? 'Aberto' : 'Fechado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.status === 'open' && (
                    <button
                      onClick={() => handleClosePeriod(p)}
                      className="text-warning hover:text-warning/80 flex items-center gap-1 text-sm"
                      title="Fechar período"
                    >
                      <Lock size={14} /> Fechar
                    </button>
                  )}
                  {p.status === 'closed' && (
                    <button
                      onClick={() => handleReopenPeriod(p)}
                      className="text-accent hover:text-accent/80 flex items-center gap-1 text-sm"
                      title="Reabrir período"
                    >
                      <LockOpen size={14} /> Reabrir
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Open Period Modal */}
      <Modal isOpen={isOpenModalOpen} onClose={() => { setIsOpenModalOpen(false); setError(''); }} title="Abrir Período Semanal">
        <form onSubmit={handleOpenPeriod} className="space-y-4">
          <Input
            label="Selecione uma data da semana"
            type="date"
            value={weekStartInput}
            onChange={(e) => {
              setWeekStartInput(e.target.value);
              setSelectedDays(new Set());
            }}
            required
          />
          {resolvedWeekStart && (
            <p className="text-xs text-text-tertiary">
              Semana: {formatDateBR(resolvedWeekStart)} (Dom) — {formatDateBR(weekDays[6])} (Sáb)
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomDays"
              checked={useCustomDays}
              onChange={(e) => setUseCustomDays(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="useCustomDays" className="text-sm text-text-primary">
              Selecionar dias específicos
            </label>
          </div>

          {useCustomDays && weekDays.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {weekDays.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedDays.has(day)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface-2 text-text-secondary border-border hover:border-accent/50'
                  }`}
                >
                  {DAY_LABELS[i]} {new Date(day + 'T12:00:00').getDate()}
                </button>
              ))}
            </div>
          )}

          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setIsOpenModalOpen(false); setError(''); }}>Cancelar</Button>
            <Button type="submit" disabled={!resolvedWeekStart}>Abrir Período</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
