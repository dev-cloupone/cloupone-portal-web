import { useState, useEffect, useCallback } from 'react';
import { Wallet, Check, Undo2, Paperclip } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import * as expenseService from '../services/expense.service';
import * as consultantService from '../services/consultant.service';
import * as projectService from '../services/project.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { PendingExpense } from '../types/expense.types';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ExpenseReimbursementsPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [data, setData] = useState<PendingExpense[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Filters
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'pending' | 'paid'>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Options for dropdowns
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await expenseService.listReimbursements({
        page,
        limit,
        consultantId: filterConsultant || undefined,
        projectId: filterProject || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
        reimbursementStatus: filterStatus || undefined,
      });
      setData(result.data);
      setTotalPending(result.totalPending);
      setTotalPaid(result.totalPaid);
      setTotalPages(result.meta.totalPages);
      // Clean up selection - remove ids no longer in data
      const currentIds = new Set(result.data.map((d) => d.id));
      setSelected((prev) => new Set([...prev].filter((id) => currentIds.has(id))));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filterConsultant, filterProject, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [consultants, projects] = await Promise.all([
          consultantService.listConsultants({ page: 1, limit: 100 }),
          projectService.listProjects({ page: 1, limit: 100 }),
        ]);
        setConsultantOptions(consultants.data.map((c) => ({ value: c.userId, label: c.userName })));
        setProjectOptions(projects.data.map((p) => ({ value: p.id, label: p.name })));
      } catch {
        /* silent */
      }
    }
    loadOptions();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterConsultant, filterProject, filterStatus, filterFrom, filterTo]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPending() {
    const pendingIds = data.filter((d) => !d.reimbursedAt).map((d) => d.id);
    const allSelected = pendingIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of pendingIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...pendingIds]));
    }
  }

  async function handleMarkReimbursed() {
    const ids = [...selected].filter((id) => {
      const item = data.find((d) => d.id === id);
      return item && !item.reimbursedAt;
    });
    if (ids.length === 0) return;

    setActionLoading(true);
    try {
      await expenseService.markAsReimbursed(ids);
      addToast(`${ids.length} despesa(s) marcada(s) como reembolsada(s).`, 'success');
      setSelected(new Set());
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnmark(id: string) {
    setActionLoading(true);
    try {
      await expenseService.unmarkReimbursement(id);
      addToast('Marcacao de reembolso desfeita.', 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  const pendingInPage = data.filter((d) => !d.reimbursedAt);
  const selectedPendingCount = [...selected].filter((id) => {
    const item = data.find((d) => d.id === id);
    return item && !item.reimbursedAt;
  }).length;

  return (
    <SidebarLayout navItems={navItems} title="Reembolsos">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Controle de Reembolsos</h2>
        <p className="text-sm text-text-muted mt-1">
          Gerencie reembolsos de despesas aprovadas dos consultores.
        </p>
      </div>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-md">
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Pendente</p>
          <p className="text-xl font-bold text-warning mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Pago</p>
          <p className="text-xl font-bold text-accent mt-1">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Select
            label="Consultor"
            options={[{ value: '', label: 'Todos' }, ...consultantOptions]}
            value={filterConsultant}
            onChange={setFilterConsultant}
          />
        </div>
        <div className="w-48">
          <Select
            label="Projeto"
            options={[{ value: '', label: 'Todos' }, ...projectOptions]}
            value={filterProject}
            onChange={setFilterProject}
          />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            options={[
              { value: '', label: 'Todos' },
              { value: 'pending', label: 'Pendente' },
              { value: 'paid', label: 'Pago' },
            ]}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as '' | 'pending' | 'paid')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">De</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Ate</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>
        {selectedPendingCount > 0 && (
          <Button onClick={handleMarkReimbursed} disabled={actionLoading} size="sm">
            <Check size={15} className="mr-1.5" />
            Marcar como Pago ({selectedPendingCount})
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <Wallet size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Nenhum reembolso encontrado</p>
          <p className="text-text-muted text-sm mt-1">
            Ajuste os filtros ou aguarde despesas aprovadas com reembolso.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className="w-10">
                    {pendingInPage.length > 0 && (
                      <input
                        type="checkbox"
                        checked={pendingInPage.length > 0 && pendingInPage.every((d) => selected.has(d.id))}
                        onChange={toggleSelectAllPending}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                      />
                    )}
                  </TableHeader>
                  <TableHeader>Consultor</TableHeader>
                  <TableHeader>Projeto</TableHeader>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Categoria</TableHeader>
                  <TableHeader className="text-right">Valor</TableHeader>
                  <TableHeader>Comprov.</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="w-16">Acao</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => {
                  const isPaid = !!item.reimbursedAt;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {!isPaid && (
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleSelected(item.id)}
                            className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{item.createdByName || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div>{item.projectName || '—'}</div>
                        {item.clientName && (
                          <div className="text-xs text-text-muted">{item.clientName}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
                      <TableCell>{item.categoryName || '—'}</TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        {item.receiptUrl ? (
                          <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                            <Paperclip size={14} />
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPaid ? (
                          <Badge variant="success">Pago</Badge>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPaid && (
                          <button
                            onClick={() => handleUnmark(item.id)}
                            disabled={actionLoading}
                            className="rounded-md p-1.5 text-text-muted hover:text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
                            title="Desfazer reembolso"
                          >
                            <Undo2 size={15} />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-text-secondary">
                Pagina {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
}
