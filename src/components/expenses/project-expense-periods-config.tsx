import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CalendarPlus, Lock, LockOpen, Pencil, Tags } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import * as periodService from '../../services/project-expense-period.service';
import { formatApiError } from '../../services/api';
import { useLocaleStore } from '../../stores/locale.store';
import type { ProjectExpensePeriod } from '../../types/expense.types';

interface Props {
  projectId: string;
}

// DAY_LABELS is defined inside the component to use t()

function formatDateBR(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(useLocaleStore.getState().locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const DAY_LABELS = [
    t('timesheet.dayHeaders.sun'),
    t('timesheet.dayHeaders.mon'),
    t('timesheet.dayHeaders.tue'),
    t('timesheet.dayHeaders.wed'),
    t('timesheet.dayHeaders.thu'),
    t('timesheet.dayHeaders.fri'),
    t('timesheet.dayHeaders.sat'),
  ];
  const [periods, setPeriods] = useState<ProjectExpensePeriod[]>([]);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ProjectExpensePeriod | null>(null);
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
      setError(t('expenses.loadPeriodsError'));
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
    if (!confirm(t('expenses.closePeriodConfirm', { start: formatDateBR(period.weekStart), end: formatDateBR(period.weekEnd) }))) return;
    try {
      await periodService.closePeriod(projectId, period.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleReopenPeriod(period: ProjectExpensePeriod) {
    if (!confirm(t('expenses.reopenPeriodConfirm', { start: formatDateBR(period.weekStart), end: formatDateBR(period.weekEnd) }))) return;
    try {
      await periodService.reopenPeriod(projectId, period.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEditModal(period: ProjectExpensePeriod) {
    const days = getWeekDays(period.weekStart);
    setEditingPeriod(period);
    setUseCustomDays(true);
    setSelectedDays(
      period.customDays && period.customDays.length > 0
        ? new Set(period.customDays)
        : new Set(days),
    );
    setError('');
  }

  async function handleUpdateDays(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPeriod) return;
    setError('');
    try {
      const customDays = selectedDays.size === 7 ? null : Array.from(selectedDays).sort();
      await periodService.updateDays(projectId, editingPeriod.id, { customDays });
      setEditingPeriod(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const editWeekDays = editingPeriod ? getWeekDays(editingPeriod.weekStart) : [];

  const openPeriods = periods.filter(p => p.status === 'open');
  const closedPeriods = periods.filter(p => p.status === 'closed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{t('expenses.weeklyPeriods')}</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/projects/${projectId}/expense-categories`)}>
            <Tags size={14} className="mr-1.5" /> {t('expenses.categoriesButton')}
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <CalendarPlus size={14} className="mr-1.5" /> {t('expenses.openWeek')}
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
          {t('expenses.noPeriodsCreated')}
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('expenses.tableWeek')}</TableHeader>
              <TableHeader>{t('expenses.tableDays')}</TableHeader>
              <TableHeader>{t('expenses.tableStatus')}</TableHeader>
              <TableHeader>{t('expenses.tableActions')}</TableHeader>
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
                    <span className="text-xs text-text-tertiary">{t('expenses.daysCount', { count: p.customDays.length })}</span>
                  ) : (
                    <span className="text-xs text-text-tertiary">{t('expenses.allDays')}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === 'open' ? 'success' : 'default'}>
                    {p.status === 'open' ? t('expenses.statusOpen') : t('expenses.statusClosed')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.status === 'open' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-accent hover:text-accent/80 flex items-center gap-1 text-sm"
                        title={t('expenses.editDays')}
                      >
                        <Pencil size={14} /> {t('expenses.editDays')}
                      </button>
                      <button
                        onClick={() => handleClosePeriod(p)}
                        className="text-warning hover:text-warning/80 flex items-center gap-1 text-sm"
                        title={t('expenses.closePeriod')}
                      >
                        <Lock size={14} /> {t('expenses.closePeriod')}
                      </button>
                    </div>
                  )}
                  {p.status === 'closed' && (
                    <button
                      onClick={() => handleReopenPeriod(p)}
                      className="text-accent hover:text-accent/80 flex items-center gap-1 text-sm"
                      title={t('expenses.reopenPeriod')}
                    >
                      <LockOpen size={14} /> {t('expenses.reopenPeriod')}
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Open Period Modal */}
      <Modal isOpen={isOpenModalOpen} onClose={() => { setIsOpenModalOpen(false); setError(''); }} title={t('expenses.openWeeklyPeriod')}>
        <form onSubmit={handleOpenPeriod} className="space-y-4">
          <Input
            label={t('expenses.selectWeekDate')}
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
              {t('expenses.weekRange', { start: formatDateBR(resolvedWeekStart), end: formatDateBR(weekDays[6]) })}
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
              {t('expenses.selectSpecificDays')}
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
            <Button variant="secondary" type="button" onClick={() => { setIsOpenModalOpen(false); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!resolvedWeekStart}>{t('expenses.openPeriod')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Period Days Modal */}
      <Modal isOpen={!!editingPeriod} onClose={() => { setEditingPeriod(null); setUseCustomDays(false); setSelectedDays(new Set()); setError(''); }} title={t('expenses.editWeeklyPeriod')}>
        <form onSubmit={handleUpdateDays} className="space-y-4">
          {editingPeriod && (
            <p className="text-xs text-text-tertiary">
              {t('expenses.weekRange', { start: formatDateBR(editingPeriod.weekStart), end: formatDateBR(editingPeriod.weekEnd) })}
            </p>
          )}

          <p className="text-sm text-text-primary">{t('expenses.selectOpenDays')}</p>

          {editWeekDays.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {editWeekDays.map((day, i) => (
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
            <Button variant="secondary" type="button" onClick={() => { setEditingPeriod(null); setUseCustomDays(false); setSelectedDays(new Set()); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={selectedDays.size === 0}>{t('expenses.saveChanges')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
