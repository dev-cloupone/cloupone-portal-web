import { useState, useEffect, useCallback, Fragment } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { PaginationControls } from '../components/ui/pagination-controls';
import * as paymentService from '../services/expense-payment.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { ExpensePayment, ExpensePaymentItem, ExpensePaymentStatus } from '../types/financial.types';
import type { PaginationMeta } from '../types/pagination.types';

const STATUS_MAP: Record<ExpensePaymentStatus, { variant: 'default' | 'warning' | 'success' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'Rascunho' },
  confirmed: { variant: 'warning', label: 'Confirmado' },
  paid: { variant: 'success', label: 'Pago' },
  cancelled: { variant: 'danger', label: 'Cancelado' },
};

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export default function MyPaymentsExpensesPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const [payments, setPayments] = useState<ExpensePayment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState<ExpensePaymentItem[]>([]);

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

  async function toggleExpand(payment: ExpensePayment) {
    if (expandedId === payment.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(payment.id);
    setDetailLoading(true);
    setDetailItems([]);
    try {
      const detail = await paymentService.getPayment(payment.id);
      setDetailItems(detail.items ?? []);
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
    <SidebarLayout navItems={navItems} title="Meus Pagamentos de Despesas">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Meus Pagamentos de Despesas</h2>
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
          <p className="text-text-secondary font-medium">Nenhum pagamento encontrado.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader className="w-8" />
                  <TableHeader>Periodo</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Total Valor</TableHeader>
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
                          {formatPeriod(payment.periodStart, payment.periodEnd)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-surface-0/50 p-0">
                            <div className="px-6 py-4">
                              {detailLoading ? (
                                <div className="space-y-2">
                                  {[1, 2].map((i) => (
                                    <Skeleton key={i} className="h-8 rounded" />
                                  ))}
                                </div>
                              ) : detailItems.length === 0 ? (
                                <p className="text-sm text-text-muted">Nenhum item encontrado.</p>
                              ) : (
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>Projeto</TableHeader>
                                      <TableHeader>Data</TableHeader>
                                      <TableHeader>Descricao</TableHeader>
                                      <TableHeader>Categoria</TableHeader>
                                      <TableHeader className="text-right">Valor</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {detailItems.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.projectName}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {formatDate(item.expenseDate)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                          {item.expenseDescription || '—'}
                                        </TableCell>
                                        <TableCell>{item.categoryName || '—'}</TableCell>
                                        <TableCell className="text-right font-mono">
                                          {formatCurrency(item.amount)}
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
