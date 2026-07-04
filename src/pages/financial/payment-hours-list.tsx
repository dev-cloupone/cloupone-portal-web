import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, Eye, Trash2, AlertTriangle, X } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { MonthNavigator } from '../../components/ui/month-navigator';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import * as paymentService from '../../services/consultant-payment.service';
import * as consultantService from '../../services/consultant.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ConsultantPayment } from '../../types/financial.types';
import type { PaginationMeta } from '../../types/pagination.types';
import { formatCurrency, getShortMonthName } from '../../utils/formatters';

const STATUS_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'payments.statusDraft' },
  confirmed: { variant: 'warning', label: 'payments.statusConfirmed' },
  paid: { variant: 'success', label: 'payments.statusPaid' },
  cancelled: { variant: 'danger', label: 'payments.statusCancelled' },
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(m: string): { year: number; month: number } {
  const [y, mo] = m.split('-').map(Number);
  return { year: y, month: mo };
}

export default function PaymentHoursListPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [data, setData] = useState<ConsultantPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);

  // Pending warning
  const [pendingWarning, setPendingWarning] = useState<{ count: number; consultants: string[] } | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Filters
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Options
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);

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
      const result = await paymentService.listPayments({
        page,
        limit: 20,
        userId: filterConsultant || undefined,
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
  }, [page, filterConsultant, filterStatus, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch pending approvals when month changes
  useEffect(() => {
    const { year, month } = parseMonth(currentMonth);
    setWarningDismissed(false);
    paymentService.getPendingApprovals(year, month)
      .then((result) => setPendingWarning(result.count > 0 ? result : null))
      .catch(() => setPendingWarning(null));
  }, [currentMonth]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const consultants = await consultantService.listConsultants({ page: 1, limit: 100 });
        setConsultantOptions(consultants.data.map((c) => ({ value: c.userId, label: c.userName })));
      } catch { /* silent */ }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterConsultant, filterStatus, currentMonth]);

  async function handleDelete(id: string) {
    if (!confirm(t('payments.deletePayment'))) return;
    try {
      await paymentService.deletePayment(id);
      addToast(t('payments.paymentDeleted'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('payments.hoursTitle')}>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('payments.hoursTitle')}</h2>
          <Button onClick={() => navigate('/financial/payments/hours/new')}>
            <DollarSign size={16} className="mr-1.5" />
            {t('payments.generatePayment')}
          </Button>
        </header>

        {/* Month Navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        {/* Pending approvals warning */}
        {pendingWarning && !warningDismissed && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <AlertTriangle size={18} className="text-warning shrink-0" />
            <p className="text-sm text-text-secondary flex-1">
              {t('payments.pendingTimesheetWarning', { count: pendingWarning.count })}:{' '}
              {pendingWarning.consultants.join(', ')}
            </p>
            <button
              onClick={() => setWarningDismissed(true)}
              className="rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
              aria-label={t('payments.closeWarning')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <Select
              label={t('common.consultant')}
              options={[{ value: '', label: t('common.all') }, ...consultantOptions]}
              value={filterConsultant}
              onChange={setFilterConsultant}
            />
          </div>
          <div className="w-40">
            <Select
              label={t('common.status')}
              options={[
                { value: '', label: t('common.all') },
                { value: 'draft', label: t('payments.statusDraft') },
                { value: 'confirmed', label: t('payments.statusConfirmed') },
                { value: 'paid', label: t('payments.statusPaid') },
                { value: 'cancelled', label: t('payments.statusCancelled') },
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
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
            <DollarSign size={40} className="text-accent mb-3" />
            <p className="text-text-secondary font-medium">{t('payments.noPaymentFound')}</p>
            <p className="text-text-muted text-sm mt-1">{t('payments.adjustOrGenerate')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('common.consultant')}</TableHeader>
                    <TableHeader>{t('payments.monthYear')}</TableHeader>
                    <TableHeader className="text-right">{t('payments.totalHours')}</TableHeader>
                    <TableHeader className="text-right">{t('payments.totalValue')}</TableHeader>
                    <TableHeader>{t('common.status')}</TableHeader>
                    <TableHeader className="w-24">{t('common.actions')}</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((payment) => {
                    const status = STATUS_MAP[payment.status] ?? STATUS_MAP.draft;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <span className="font-medium text-sm">{payment.consultantName}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getShortMonthName(payment.billingMonth - 1)}/{payment.billingYear}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {Number(payment.totalHours).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{t(status.label)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/financial/payments/hours/${payment.id}`)}
                              className="rounded-md p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                              title={t('payments.viewDetails')}
                            >
                              <Eye size={15} />
                            </button>
                            {payment.status === 'draft' && (
                              <button
                                onClick={() => handleDelete(payment.id)}
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
