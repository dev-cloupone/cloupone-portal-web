import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Eye, Trash2 } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { IconButton } from '../../components/ui/icon-button';
import { Modal } from '../../components/ui/modal';
import { ExpenseDetailModal } from '../../components/expenses/expense-detail-modal';
import { RevertInvoiceModal } from '../../components/financial/revert-invoice-modal';
import * as invoiceService from '../../services/expense-invoice.service';
import { listActiveBankAccounts, type BankAccountOption } from '../../services/bank-accounts.service';
import { formatApiError, apiFetch } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ExpenseInvoice, ExpenseInvoiceItem } from '../../types/financial.types';
import { useTranslation } from 'react-i18next';
import { INVOICE_STATUS_MAP } from '../../constants/invoice-status';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface EditableItem {
  id: string;
  expenseId: string;
  description: string;
  originalAmount: string;
  appliedAmount: string;
  categoryName: string | null;
  categoryMaxAmount: string | null;
}

export default function InvoiceExpensesDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [invoice, setInvoice] = useState<ExpenseInvoice | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [revertModal, setRevertModal] = useState<'to-draft' | 'to-issued' | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
      setNotes(data.notes || '');
      setItems(
        (data.items || []).map((item: ExpenseInvoiceItem) => ({
          id: item.id,
          expenseId: item.expenseId,
          description: item.description ?? '',
          originalAmount: item.originalAmount,
          appliedAmount: item.appliedAmount,
          categoryName: item.categoryName,
          categoryMaxAmount: item.categoryMaxAmount,
        })),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadInvoice(); }, [loadInvoice]);

  useEffect(() => {
    listActiveBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  function updateItem(index: number, field: 'appliedAmount' | 'description', value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function calcTotal(): number {
    return Math.round(items.reduce((sum, item) => sum + Number(item.appliedAmount), 0) * 100) / 100;
  }

  async function handleSave() {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.updateItems(id, {
        items: items.map((item) => ({ id: item.id, appliedAmount: item.appliedAmount, description: item.description || undefined })),
        notes: notes || undefined,
      });
      await loadInvoice();
      addToast(t('invoices.saved'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleIssue() {
    if (!id || !confirm(t('invoices.confirmIssue'))) return;
    setActionLoading(true);
    try {
      await invoiceService.updateItems(id, {
        items: items.map((item) => ({ id: item.id, appliedAmount: item.appliedAmount, description: item.description || undefined })),
        notes: notes || undefined,
      });
      await invoiceService.issueInvoice(id);
      await loadInvoice();
      addToast(t('invoices.savedAndIssued'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay() {
    if (!id || !confirm(t('invoices.confirmPay'))) return;
    setActionLoading(true);
    try {
      await invoiceService.payInvoice(id);
      await loadInvoice();
      addToast(t('invoices.markedAsPaid'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm(t('invoices.confirmCancel'))) return;
    setActionLoading(true);
    try {
      await invoiceService.cancelInvoice(id);
      await loadInvoice();
      addToast(t('invoices.cancelled'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm(t('invoices.confirmDelete'))) return;
    setActionLoading(true);
    try {
      await invoiceService.deleteInvoice(id);
      addToast(t('invoices.deleted'), 'success');
      navigate('/financial/invoices/expenses');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      setActionLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!id || !selectedBankAccountId) return;
    setPdfLoading(true);
    try {
      const response = await apiFetch(`/invoices/expenses/${id}/pdf?bankAccountId=${selectedBankAccountId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setShowPdfModal(false);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!id || !confirm(t('invoices.confirmRemoveItem'))) return;
    setActionLoading(true);
    try {
      const result = await invoiceService.removeItem(id, itemId);
      if (result.invoiceDeleted) {
        addToast(t('invoices.itemRemovedInvoiceDeleted'), 'success');
        navigate('/financial/invoices/expenses');
        return;
      }
      await loadInvoice();
      addToast(t('invoices.itemRemoved'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevertToDraft() {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.revertToDraft(id);
      await loadInvoice();
      addToast(t('invoices.revertedToDraft'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevertToIssued() {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.revertToIssued(id);
      await loadInvoice();
      addToast(t('invoices.revertedToIssued'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadReceipts() {
    if (!id) return;
    try {
      const response = await apiFetch(`/invoices/expenses/${id}/receipts-zip`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get('content-disposition');
      const match = disposition?.match(/filename="?(.+?)"?$/);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] ?? 'comprovantes.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title={t('invoices.expenseInvoiceTitle')}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !invoice) {
    return (
      <SidebarLayout navItems={navItems} title={t('invoices.expenseInvoiceTitle')}>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-danger mb-4">{error || t('invoices.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/financial/invoices/expenses')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            {t('common.backToList')}
          </button>
        </div>
      </SidebarLayout>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isIssued = invoice.status === 'issued';
  const isPaid = invoice.status === 'paid';
  const status = INVOICE_STATUS_MAP[invoice.status] ?? INVOICE_STATUS_MAP.draft;

  return (
    <SidebarLayout navItems={navItems} title={t('invoices.expenseInvoiceTitle')}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/expenses')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>

        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {invoice.invoiceNumber ? t('invoices.invoiceNumber', { number: invoice.invoiceNumber }) : t('invoices.draft')}
            <span className="mx-2 text-text-muted">—</span>
            <span className="text-lg">{invoice.projectName}</span>
          </h2>
          <Badge variant={status.variant}>{t(status.label)}</Badge>
        </div>
        <p className="text-sm text-text-muted mt-1">
          {t('invoices.clientLabel')} {invoice.clientName} | {t('invoices.periodLabel')} {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
        </p>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('common.description')}</TableHeader>
              <TableHeader>{t('invoices.categoryLimit')}</TableHeader>
              <TableHeader className="text-right">{t('invoices.originalAmount')}</TableHeader>
              <TableHeader className="text-right">{t('invoices.chargedAmount')}</TableHeader>
              <TableHeader className="w-20 text-center">{t('common.actions')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  {isDraft ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm">{item.description || '—'}</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{item.categoryName || '—'}</span>
                  {item.categoryMaxAmount != null && Number(item.categoryMaxAmount) > 0 && (
                    <div className={`text-xs ${Number(item.originalAmount) > Number(item.categoryMaxAmount) ? 'text-danger font-medium' : 'text-text-muted'}`}>
                      {t('invoices.limitLabel')} {formatCurrency(item.categoryMaxAmount)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(item.originalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {isDraft ? (
                    <input
                      type="number"
                      step="0.01"
                      value={item.appliedAmount}
                      onChange={(e) => updateItem(index, 'appliedAmount', e.target.value)}
                      className="w-28 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  ) : (
                    <span className="font-mono">{formatCurrency(item.appliedAmount)}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IconButton
                      onClick={() => setSelectedExpenseId(item.expenseId)}
                      aria-label={t('invoices.viewExpense')}
                      title={t('invoices.viewExpense')}
                    >
                      <Eye size={15} />
                    </IconButton>
                    {isDraft && (
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={t('invoices.removeItem')}
                        title={t('invoices.removeItem')}
                        disabled={actionLoading}
                      >
                        <Trash2 size={15} className="text-danger" />
                      </IconButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right">
                <span className="font-semibold text-sm text-text-primary">{t('common.total')}</span>
              </TableCell>
              <TableCell className="text-right font-mono font-semibold whitespace-nowrap">
                {formatCurrency(calcTotal())}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">{t('common.notes')}</h3>
        {isDraft ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('invoices.notesPlaceholder')}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{notes || t('common.noNotes')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? t('common.saving') : t('common.save')}
            </Button>
            <Button variant="secondary" onClick={handleIssue} disabled={actionLoading}>
              {t('invoices.issue')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
              {t('common.delete')}
            </Button>
          </>
        )}
        {isIssued && (
          <>
            <Button onClick={handlePay} disabled={actionLoading}>
              {t('invoices.markPaid')}
            </Button>
            <Button variant="secondary" onClick={() => setRevertModal('to-draft')} disabled={actionLoading}>
              {t('invoices.revertToDraft')}
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadPdf')}
            </Button>
            <Button variant="secondary" onClick={handleDownloadReceipts}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadReceipts')}
            </Button>
          </>
        )}
        {isPaid && (
          <>
            <Button variant="secondary" onClick={() => setRevertModal('to-issued')} disabled={actionLoading}>
              {t('invoices.revertToIssued')}
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadPdf')}
            </Button>
            <Button variant="secondary" onClick={handleDownloadReceipts}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadReceipts')}
            </Button>
          </>
        )}
        {invoice.status === 'cancelled' && invoice.invoiceNumber && (
          <>
            <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadPdf')}
            </Button>
            <Button variant="secondary" onClick={handleDownloadReceipts}>
              <Download size={15} className="mr-1.5" />
              {t('invoices.downloadReceipts')}
            </Button>
          </>
        )}
      </div>

      <ExpenseDetailModal
        expenseId={selectedExpenseId}
        isOpen={!!selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />

      <RevertInvoiceModal
        isOpen={!!revertModal}
        onClose={() => setRevertModal(null)}
        onConfirm={revertModal === 'to-draft' ? handleRevertToDraft : handleRevertToIssued}
        type={revertModal ?? 'to-draft'}
        invoiceNumber={invoice.invoiceNumber}
      />

      <Modal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} title={t('invoices.generatePdfTitle')}>
        {bankAccounts.length === 0 ? (
          <p className="text-sm text-text-muted">{t('reports.registerBankAccounts')}</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('invoices.paymentAccount')}</label>
            <select
              value={selectedBankAccountId}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="">{t('invoices.selectAccount')}</option>
              {bankAccounts.map((ba) => (
                <option key={ba.id} value={ba.id}>{ba.label}</option>
              ))}
            </select>
          </>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowPdfModal(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDownloadPdf} disabled={!selectedBankAccountId || pdfLoading}>
            {pdfLoading ? t('common.generating') : t('reports.generatePdf')}
          </Button>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
