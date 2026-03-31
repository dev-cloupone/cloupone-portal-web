import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, CheckCheck, User, Receipt, Paperclip, MessageSquare } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import * as expenseService from '../services/expense.service';
import { BASE_URL } from '../services/api';
import * as consultantService from '../services/consultant.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { PendingExpense } from '../types/expense.types';

interface PendingExpenseGroup {
  key: string;
  userId: string;
  userName: string;
  userEmail: string;
  weekStart: string;
  weekEnd: string;
  expenses: PendingExpense[];
  totalAmount: number;
}

function getSunday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function groupByWeek(entries: PendingExpense[]): PendingExpenseGroup[] {
  const groups = new Map<string, PendingExpenseGroup>();

  for (const entry of entries) {
    const sunday = getSunday(entry.date);
    const userId = entry.createdByUserId;
    const key = `${userId}-${sunday}`;

    if (!groups.has(key)) {
      const sundayDate = new Date(sunday + 'T12:00:00');
      const saturdayDate = new Date(sundayDate);
      saturdayDate.setDate(sundayDate.getDate() + 6);

      groups.set(key, {
        key,
        userId,
        userName: entry.createdByName || 'Consultor',
        userEmail: entry.createdByEmail || '',
        weekStart: sunday,
        weekEnd: saturdayDate.toISOString().split('T')[0],
        expenses: [],
        totalAmount: 0,
      });
    }

    const group = groups.get(key)!;
    group.expenses.push(entry);
    group.totalAmount += Number(entry.amount);
  }

  return Array.from(groups.values()).sort((a, b) => {
    const weekComp = a.weekStart.localeCompare(b.weekStart);
    if (weekComp !== 0) return weekComp;
    return a.userName.localeCompare(b.userName);
  });
}

export default function ExpenseApprovalsPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const [groups, setGroups] = useState<PendingExpenseGroup[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);

  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await expenseService.listPending({
        page: 1,
        limit: 100,
        consultantId: filterConsultant || undefined,
      });
      const grouped = groupByWeek(result.data);
      setGroups(grouped);
      const validKeys = new Set(grouped.map((g) => g.key));
      setExpanded((prev) => new Set([...prev].filter((k) => validKeys.has(k))));
      setSelected((prev) => new Set([...prev].filter((k) => validKeys.has(k))));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filterConsultant]);

  async function loadConsultants() {
    try {
      const result = await consultantService.listConsultants({ page: 1, limit: 100 });
      setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName })));
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadConsultants();
  }, []);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === groups.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(groups.map((g) => g.key)));
    }
  }

  async function handleBatchApprove() {
    const ids = groups
      .filter((g) => selected.has(g.key))
      .flatMap((g) => g.expenses.map((e) => e.id));
    if (ids.length === 0) return;
    try {
      await expenseService.approveExpenses(ids);
      addToast(`${ids.length} despesa(s) aprovada(s) com sucesso.`, 'success');
      setSelected(new Set());
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleApproveGroup(ids: string[]) {
    setActionLoading(true);
    try {
      await expenseService.approveExpenses(ids);
      addToast(`${ids.length} despesa(s) aprovada(s).`, 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveOne(id: string) {
    setActionLoading(true);
    try {
      await expenseService.approveExpenses([id]);
      addToast('Despesa aprovada.', 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectingId || !rejectComment.trim()) return;
    setActionLoading(true);
    try {
      await expenseService.rejectExpense(rejectingId, rejectComment);
      addToast('Despesa rejeitada.', 'warning');
      setRejectingId(null);
      setRejectComment('');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  const totalPending = groups.reduce((sum, g) => sum + g.expenses.length, 0);
  const totalAmount = groups.reduce((sum, g) => sum + g.totalAmount, 0);

  return (
    <SidebarLayout navItems={navItems} title="Aprov. Despesas">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Aprovacao de Despesas</h2>
          <p className="text-sm text-text-muted mt-1">
            {totalPending} despesa{totalPending !== 1 ? 's' : ''} pendente{totalPending !== 1 ? 's' : ''}
            {totalPending > 0 && ` — Total: ${formatCurrency(totalAmount)}`}
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="w-56">
            <Select
              label="Filtrar consultor"
              options={[
                { value: '', label: 'Todos os consultores' },
                ...consultantOptions,
              ]}
              value={filterConsultant}
              onChange={setFilterConsultant}
            />
          </div>
          {selected.size > 0 && (
            <Button onClick={handleBatchApprove} size="sm">
              <CheckCheck size={15} className="mr-1.5" />
              Aprovar {selected.size} semana{selected.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <CheckCheck size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Nenhuma despesa pendente</p>
          <p className="text-text-muted text-sm mt-1">
            Todas as despesas foram processadas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.length > 1 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selected.size === groups.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
              />
              <span className="text-xs text-text-muted">Selecionar tudo</span>
            </div>
          )}

          {groups.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-border bg-surface-1 overflow-hidden"
            >
              {/* Group header */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface-2/50 transition-colors"
                onClick={() => toggleExpanded(group.key)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(group.key)}
                  onChange={() => toggleSelected(group.key)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                />
                <button className="text-text-muted" type="button">
                  {expanded.has(group.key) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-text-muted shrink-0" />
                    <span className="font-semibold text-sm text-text-primary truncate">
                      {group.userName}
                    </span>
                    <span className="text-xs text-text-muted hidden sm:inline">
                      {group.userEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Receipt size={12} className="text-text-muted shrink-0" />
                    <span className="text-xs text-text-secondary">
                      {formatWeekRange(group.weekStart, group.weekEnd)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="warning">{formatCurrency(group.totalAmount)}</Badge>
                  <span className="text-xs text-text-muted">
                    {group.expenses.length} item{group.expenses.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded.has(group.key) && (
                <div className="border-t border-border px-4 py-3 bg-surface-0/50">
                  <ExpenseGroupDetail
                    expenses={group.expenses}
                    onApproveAll={(ids) => handleApproveGroup(ids)}
                    onApproveOne={handleApproveOne}
                    onReject={(id) => {
                      setRejectingId(id);
                      setRejectComment('');
                    }}
                    loading={actionLoading}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title="Rejeitar Despesa"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Informe o motivo da rejeicao. O consultor sera notificado e podera corrigir a despesa.
          </p>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Motivo
            </label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Descreva o motivo da rejeicao..."
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setRejectingId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={actionLoading || !rejectComment.trim()}
            >
              <MessageSquare size={15} className="mr-1.5" /> Rejeitar
            </Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}

// --- Group detail sub-component ---

interface ExpenseGroupDetailProps {
  expenses: PendingExpense[];
  onApproveAll: (ids: string[]) => void;
  onApproveOne: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}

function ExpenseGroupDetail({ expenses, onApproveAll, onApproveOne, onReject, loading }: ExpenseGroupDetailProps) {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Data</TableHeader>
              <TableHeader>Projeto</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader className="text-right">Valor</TableHeader>
              <TableHeader>Descricao</TableHeader>
              <TableHeader>Comprov.</TableHeader>
              <TableHeader className="w-24">Acoes</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell>
                  <div>{expense.projectName || '—'}</div>
                  {expense.clientName && (
                    <div className="text-xs text-text-muted">{expense.clientName}</div>
                  )}
                </TableCell>
                <TableCell>{expense.categoryName || '—'}</TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description || '—'}
                </TableCell>
                <TableCell>
                  {expense.receiptFileId ? (
                    <a href={`${BASE_URL}/uploads/download/${expense.receiptFileId}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      <Paperclip size={14} />
                    </a>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onApproveOne(expense.id)}
                      disabled={loading}
                      className="rounded-md p-1.5 text-accent hover:bg-success-muted transition-colors disabled:opacity-50"
                      title="Aprovar"
                    >
                      <CheckCheck size={15} />
                    </button>
                    <button
                      onClick={() => onReject(expense.id)}
                      disabled={loading}
                      className="rounded-md p-1.5 text-danger hover:bg-danger-muted transition-colors disabled:opacity-50"
                      title="Rejeitar"
                    >
                      <MessageSquare size={15} />
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
          <span className="font-semibold text-text-primary">{formatCurrency(total)}</span>
          {' \u00b7 '}
          {sorted.length} despesa{sorted.length !== 1 ? 's' : ''}
        </span>
        <Button onClick={() => onApproveAll(sorted.map(e => e.id))} disabled={loading} size="sm">
          <CheckCheck size={15} className="mr-1.5" /> Aprovar Tudo
        </Button>
      </div>
    </div>
  );
}
