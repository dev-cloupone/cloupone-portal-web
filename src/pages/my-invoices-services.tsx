import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { PaginationControls } from '../components/ui/pagination-controls';
import * as invoiceService from '../services/invoice.service';
import { formatApiError, apiFetch } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { Invoice, InvoiceLine } from '../types/financial.types';
import type { PaginationMeta } from '../types/pagination.types';
import { useTranslation } from 'react-i18next';
import { INVOICE_STATUS_MAP } from '../constants/invoice-status';
import { formatCurrency, getShortMonthName } from '../utils/formatters';

export default function MyInvoicesServicesPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [data, setData] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<Invoice | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await invoiceService.listMyInvoices({ page, limit: 20 });
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleExpand(invoice: Invoice) {
    if (expandedId === invoice.id) {
      setExpandedId(null);
      setExpandedInvoice(null);
      return;
    }
    try {
      const detail = await invoiceService.getInvoice(invoice.id);
      setExpandedInvoice(detail);
      setExpandedId(invoice.id);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleDownloadPdf(id: string) {
    try {
      const response = await apiFetch(`/invoices/services/${id}/pdf`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title="Fat. Serviços">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Minhas Faturas de Serviços</h2>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
            <FileText size={40} className="text-accent mb-3" />
            <p className="text-text-secondary font-medium">{t('invoices.noInvoicesFound')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader className="w-8" />
                    <TableHeader>Nº</TableHeader>
                    <TableHeader>{t('common.project')}</TableHeader>
                    <TableHeader>{t('payments.monthYear')}</TableHeader>
                    <TableHeader>{t('common.status')}</TableHeader>
                    <TableHeader className="text-right">Total Horas</TableHeader>
                    <TableHeader className="text-right">Total Valor</TableHeader>
                    <TableHeader className="w-20">PDF</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((invoice) => {
                    const status = INVOICE_STATUS_MAP[invoice.status] ?? { variant: 'default' as const, label: invoice.status };
                    const isExpanded = expandedId === invoice.id;
                    return (
                      <>
                        <TableRow key={invoice.id} className="cursor-pointer" onClick={() => toggleExpand(invoice)}>
                          <TableCell>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                          <TableCell><span className="font-medium text-sm">{invoice.projectName}</span></TableCell>
                          <TableCell>{getShortMonthName(invoice.month - 1)}/{invoice.year}</TableCell>
                          <TableCell><Badge variant={status.variant}>{t(status.label)}</Badge></TableCell>
                          <TableCell className="text-right font-mono">{Number(invoice.totalHours).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDownloadPdf(invoice.id); }}
                            >
                              <Download size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && expandedInvoice && (
                          <TableRow key={`${invoice.id}-detail`}>
                            <TableCell colSpan={8}>
                              <div className="py-3 px-4 bg-surface-2 rounded-lg">
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableHeader>{t('invoices.consultantColumn')}</TableHeader>
                                      <TableHeader className="text-right">Horas</TableHeader>
                                      <TableHeader className="text-right">Rate</TableHeader>
                                      <TableHeader className="text-right">Subtotal</TableHeader>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {(expandedInvoice.lines || []).filter((l: InvoiceLine) => l.lineType === 'hours').map((line: InvoiceLine) => (
                                      <TableRow key={line.id}>
                                        <TableCell>{line.consultantName}</TableCell>
                                        <TableCell className="text-right font-mono">{Number(line.appliedHours).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(line.appliedRate)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(line.subtotal)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
