import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { PaginationControls } from '../components/ui/pagination-controls';
import * as paymentService from '../services/consultant-payment.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { ConsultantPayment, ConsultantPaymentLine, ConsultantPaymentStatus } from '../types/financial.types';
import type { PaginationMeta } from '../types/pagination.types';
import { formatCurrency, getShortMonthName } from '../utils/formatters';

const STATUS_MAP: Record<ConsultantPaymentStatus, { variant: 'default' | 'warning' | 'success' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'payments.statusDraft' },
  confirmed: { variant: 'warning', label: 'payments.statusConfirmed' },
  paid: { variant: 'success', label: 'payments.statusPaid' },
  cancelled: { variant: 'danger', label: 'payments.statusCancelled' },
};

export default function MyPaymentsHoursPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [payments, setPayments] = useState<ConsultantPayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLines, setDetailLines] = useState<ConsultantPaymentLine[]>([]);

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentService.listMyPayments({ page, limit: 20 });
      setPayments(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleExpand(payment: ConsultantPayment) {
    if (expandedId === payment.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(payment.id);
    setDetailLoading(true);
    setDetailLines([]);
    try {
      const detail = await paymentService.getPayment(payment.id);
      setDetailLines(detail.lines ?? []);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDownloadReceipt(paymentId: string) {
    try {
      const url = await paymentService.getReceiptUrl(paymentId);
      window.open(url, '_blank');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('payments.myHoursPayments')}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('payments.myHoursPayments')}</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <p className="text-text-secondary font-medium">{t('payments.noPaymentFound')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className="w-8" />
                  <TableHeader>{t('payments.monthYear')}</TableHeader>
                  <TableHeader>{t('common.status')}</TableHeader>
                  <TableHeader className="text-right">{t('payments.totalHours')}</TableHeader>
                  <TableHeader className="text-right">{t('payments.totalValue')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => {
                  const statusInfo = STATUS_MAP[payment.status];
                  const isExpanded = expandedId === payment.id;
                  return (
                    <Fragment key={payment.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-surface-2/50 transition-colors"
                        onClick={() => toggleExpand(payment)}
                      >
                        <TableCell>
                          <button type="button" className="text-text-muted">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getShortMonthName(payment.month - 1)}/{payment.year}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{t(statusInfo.label)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(payment.totalHours).toFixed(2)}h
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-surface-0/50 p-0">
                            <div className="px-6 py-4">
                              {detailLoading ? (
                                <div className="space-y-2">
                                  {[1, 2].map((i) => (
                                    <Skeleton key={i} className="h-8 rounded" />
                                  ))}
                                </div>
                              ) : detailLines.length === 0 ? (
                                <p className="text-sm text-text-muted">{t('payments.noLineFound')}</p>
                              ) : (
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>{t('common.project')}</TableHeader>
                                      <TableHeader className="text-right">{t('timesheet.hours')}</TableHeader>
                                      <TableHeader className="text-right">{t('payments.rate')}</TableHeader>
                                      <TableHeader className="text-right">{t('common.subtotal')}</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {detailLines.map((line) => (
                                      <TableRow key={line.id}>
                                        <TableCell>{line.projectName}</TableCell>
                                        <TableCell className="text-right font-mono">
                                          {Number(line.appliedHours).toFixed(2)}h
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                          {formatCurrency(line.appliedRate)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                          {formatCurrency(line.subtotal)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                              {payment.status === 'paid' && payment.receiptFileId && (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReceipt(payment.id);
                                    }}
                                  >
                                    <Download size={14} className="mr-1.5" />
                                    Download Comprovante
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <PaginationControls meta={meta} onPageChange={(page) => loadData(page)} />
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
