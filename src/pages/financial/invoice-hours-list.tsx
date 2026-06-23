import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Eye, Trash2, AlertTriangle, X } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { MonthNavigator } from '../../components/ui/month-navigator';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import * as invoiceService from '../../services/invoice.service';
import * as projectService from '../../services/project.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { Invoice } from '../../types/financial.types';
import type { PaginationMeta } from '../../types/pagination.types';
import { INVOICE_STATUS_MAP } from '../../constants/invoice-status';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLastMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(m: string): { year: number; month: number } {
  const [y, mo] = m.split('-').map(Number);
  return { year: y, month: mo };
}

export default function InvoiceHoursListPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [data, setData] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(getLastMonth);
  const [pendingWarning, setPendingWarning] = useState<{ count: number; consultants: string[] } | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [installmentWarning, setInstallmentWarning] = useState<{ count: number; projects: { projectId: string; projectName: string; count: number }[] } | null>(null);
  const [installmentWarningDismissed, setInstallmentWarningDismissed] = useState(false);

  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterInvoiceType, setFilterInvoiceType] = useState('');
  const [page, setPage] = useState(1);

  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);

  function goToPreviousMonth() {
    setCurrentMonth((prev) => {
      const { year, month } = parseMonth(prev);
      const d = new Date(year, month - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => {
      const { year, month } = parseMonth(prev);
      const d = new Date(year, month, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  function goToDefault() {
    setCurrentMonth(getLastMonth());
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { year, month } = parseMonth(currentMonth);
      const result = await invoiceService.listInvoices({
        page,
        limit: 20,
        projectId: filterProject || undefined,
        status: filterStatus || undefined,
        invoiceType: filterInvoiceType || undefined,
        year,
        month,
      });
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filterProject, filterStatus, filterInvoiceType, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const { year, month } = parseMonth(currentMonth);
    setWarningDismissed(false);
    setInstallmentWarningDismissed(false);
    invoiceService.getPendingApprovals(year, month)
      .then((result) => setPendingWarning(result.count > 0 ? result : null))
      .catch(() => setPendingWarning(null));
    invoiceService.getPendingInstallments()
      .then((result) => setInstallmentWarning(result.count > 0 ? result : null))
      .catch(() => setInstallmentWarning(null));
  }, [currentMonth]);

  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100, status: 'active' })
      .then((result) => setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterProject, filterStatus, filterInvoiceType, currentMonth]);

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta fatura?')) return;
    try {
      await invoiceService.deleteInvoice(id);
      addToast('Fatura excluída.', 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title="Fat. Horas">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Faturamento de Horas</h2>
          <Button onClick={() => navigate('/financial/invoices/hours/new')}>
            <FileText size={16} className="mr-1.5" />
            Gerar Fatura
          </Button>
        </header>

        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToDefault}
        />

        {pendingWarning && !warningDismissed && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <AlertTriangle size={18} className="text-warning shrink-0" />
            <p className="text-sm text-text-secondary flex-1">
              <strong>{pendingWarning.count}</strong> consultor(es) com timesheet pendente de aprovação:{' '}
              {pendingWarning.consultants.join(', ')}
            </p>
            <button
              onClick={() => setWarningDismissed(true)}
              className="rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
              aria-label="Fechar aviso"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {installmentWarning && !installmentWarningDismissed && (() => {
          const MAX_PROJECTS = 2;
          const displayed = installmentWarning.projects.slice(0, MAX_PROJECTS);
          const remaining = installmentWarning.projects.length - MAX_PROJECTS;
          const projectText = displayed.map(p => `${p.projectName} (${p.count})`).join(', ')
            + (remaining > 0 ? ` e mais ${remaining} projeto${remaining > 1 ? 's' : ''}` : '');
          return (
            <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <AlertTriangle size={18} className="text-warning shrink-0" />
              <p className="text-sm text-text-secondary flex-1">
                <strong>{installmentWarning.count}</strong> parcela(s) com vencimento até este mês ainda não possuem fatura gerada.{' '}
                {projectText}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/financial/invoices/hours/new?type=fixed_price')}
              >
                Gerar Faturas
              </Button>
              <button
                onClick={() => setInstallmentWarningDismissed(true)}
                className="rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                aria-label="Fechar aviso"
              >
                <X size={16} />
              </button>
            </div>
          );
        })()}

        <div className="flex flex-wrap gap-3 items-end">
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
                { value: 'draft', label: 'Rascunho' },
                { value: 'issued', label: 'Emitida' },
                { value: 'paid', label: 'Paga' },
                { value: 'cancelled', label: 'Cancelada' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
            />
          </div>
          <div className="w-40">
            <Select
              label="Tipo"
              options={[
                { value: '', label: 'Todos' },
                { value: 'hourly', label: 'Por Hora' },
                { value: 'fixed_price', label: 'Valor Fixo' },
              ]}
              value={filterInvoiceType}
              onChange={setFilterInvoiceType}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
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
            <FileText size={40} className="text-accent mb-3" />
            <p className="text-text-secondary font-medium">Nenhuma fatura encontrada</p>
            <p className="text-text-muted text-sm mt-1">Ajuste os filtros ou gere uma nova fatura.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Nº</TableHeader>
                    <TableHeader>Projeto</TableHeader>
                    <TableHeader>Cliente</TableHeader>
                    <TableHeader>Mês/Ano</TableHeader>
                    <TableHeader className="text-right">Total Horas</TableHeader>
                    <TableHeader className="text-right">Total Valor</TableHeader>
                    <TableHeader>Tipo</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="w-24">Ações</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((invoice) => {
                    const status = INVOICE_STATUS_MAP[invoice.status] ?? INVOICE_STATUS_MAP.draft;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{invoice.projectName}</span>
                        </TableCell>
                        <TableCell className="text-sm">{invoice.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {MONTH_NAMES[invoice.month - 1]}/{invoice.year}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {invoice.invoiceType === 'fixed_price' ? '—' : Number(invoice.totalHours).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.invoiceType === 'fixed_price' ? 'accent' : 'default'}>
                            {invoice.invoiceType === 'fixed_price' ? 'Valor Fixo' : 'Por Hora'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/financial/invoices/hours/${invoice.id}`)}
                              className="rounded-md p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye size={15} />
                            </button>
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                className="rounded-md p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <PaginationControls meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
