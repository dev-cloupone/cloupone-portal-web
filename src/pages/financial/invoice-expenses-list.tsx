import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Receipt, Eye, Trash2 } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { MonthNavigator } from '../../components/ui/month-navigator';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import * as invoiceService from '../../services/expense-invoice.service';
import * as projectService from '../../services/project.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ExpenseInvoice } from '../../types/financial.types';
import type { PaginationMeta } from '../../types/pagination.types';
import { useTranslation } from 'react-i18next';
import { INVOICE_STATUS_MAP } from '../../constants/invoice-status';
import { formatCurrency, formatDate } from '../../utils/formatters';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(m: string): { year: number; month: number } {
  const [y, mo] = m.split('-').map(Number);
  return { year: y, month: mo };
}

export default function InvoiceExpensesListPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [data, setData] = useState<ExpenseInvoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
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

  function goToToday() {
    setCurrentMonth(getCurrentMonth());
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
  }, [page, filterProject, filterStatus, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100, status: 'active' })
      .then((result) => setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [filterProject, filterStatus, currentMonth]);

  async function handleDelete(id: string) {
    if (!confirm(t('invoices.confirmDelete'))) return;
    try {
      await invoiceService.deleteInvoice(id);
      addToast(t('invoices.deleted'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('invoices.expenseInvoiceListTitle')}>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('invoices.expenseInvoiceListHeading')}</h2>
          <Button onClick={() => navigate('/financial/invoices/expenses/new')}>
            <Receipt size={16} className="mr-1.5" />
            {t('invoicesPages.generateInvoice')}
          </Button>
        </header>

        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <Select
              label={t('common.project')}
              options={[{ value: '', label: t('common.all') }, ...projectOptions]}
              value={filterProject}
              onChange={setFilterProject}
            />
          </div>
          <div className="w-40">
            <Select
              label={t('common.status')}
              options={[
                { value: '', label: t('common.all') },
                { value: 'draft', label: t('invoices.statusDraft') },
                { value: 'issued', label: t('invoices.statusIssued') },
                { value: 'paid', label: t('invoices.statusPaid') },
                { value: 'cancelled', label: t('invoices.statusCancelled') },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
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
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
            <Receipt size={40} className="text-accent mb-3" />
            <p className="text-text-secondary font-medium">{t('invoices.noInvoicesFound')}</p>
            <p className="text-text-muted text-sm mt-1">{t('invoices.adjustOrGenerate')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('invoices.numberColumn')}</TableHeader>
                    <TableHeader>{t('common.project')}</TableHeader>
                    <TableHeader>{t('invoices.clientLabel').replace(':', '')}</TableHeader>
                    <TableHeader>{t('common.period')}</TableHeader>
                    <TableHeader className="text-right">{t('payments.totalValue')}</TableHeader>
                    <TableHeader>{t('common.status')}</TableHeader>
                    <TableHeader className="w-24">{t('common.actions')}</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((invoice) => {
                    const status = INVOICE_STATUS_MAP[invoice.status] ?? INVOICE_STATUS_MAP.draft;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">{invoice.invoiceNumber ?? '—'}</TableCell>
                        <TableCell><span className="font-medium text-sm">{invoice.projectName}</span></TableCell>
                        <TableCell className="text-sm">{invoice.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{t(status.label)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/financial/invoices/expenses/${invoice.id}`)}
                              className="rounded-md p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                              title={t('invoices.viewDetails')}
                            >
                              <Eye size={15} />
                            </button>
                            {invoice.status === 'draft' && (
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                className="rounded-md p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                title={t('common.delete')}
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
