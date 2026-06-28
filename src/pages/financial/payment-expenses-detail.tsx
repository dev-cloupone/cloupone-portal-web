import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Modal } from '../../components/ui/modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { FileUpload } from '../../components/ui/file-upload';
import * as paymentService from '../../services/expense-payment.service';
import { uploadFile } from '../../services/uploads';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ExpensePayment } from '../../types/financial.types';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(useLocaleStore.getState().locale);
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'payments.statusDraft', variant: 'default' },
  confirmed: { label: 'payments.statusConfirmed', variant: 'warning' },
  paid: { label: 'payments.statusPaid', variant: 'success' },
  cancelled: { label: 'payments.statusCancelled', variant: 'danger' },
};

export default function PaymentExpensesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [payment, setPayment] = useState<ExpensePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Pay modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptFileId, setReceiptFileId] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadPayment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await paymentService.getPayment(id);
      setPayment(data);
      setNotes(data.notes ?? '');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  async function handleSaveNotes() {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await paymentService.updatePayment(id, { notes });
      setPayment(updated);
      addToast(t('payments.notesSaved'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    if (!id || !confirm(t('payments.confirmPayment'))) return;
    setActionLoading(true);
    try {
      await paymentService.confirmPayment(id);
      await loadPayment();
      addToast(t('payments.paymentConfirmed'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay() {
    if (!id) return;
    setActionLoading(true);
    try {
      await paymentService.payPayment(id, {
        receiptFileId: receiptFileId || undefined,
      });
      await loadPayment();
      setPayModalOpen(false);
      setReceiptFileId('');
      setReceiptFileName('');
      addToast(t('payments.paymentPaid'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevert() {
    if (!id || !confirm(t('payments.revertToDraft'))) return;
    setActionLoading(true);
    try {
      await paymentService.revertPayment(id);
      await loadPayment();
      addToast(t('payments.paymentReverted'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm(t('payments.cancelPaymentWarning'))) return;
    setActionLoading(true);
    try {
      await paymentService.cancelPayment(id);
      await loadPayment();
      addToast(t('payments.paymentCancelled'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm(t('payments.deletePayment'))) return;
    setActionLoading(true);
    try {
      await paymentService.deletePayment(id);
      addToast(t('payments.paymentDeleted'), 'success');
      navigate('/financial/payments/expenses');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!id) return;
    try {
      const url = await paymentService.getReceiptUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title={t('payments.expensesTitle')}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-60 rounded-lg" />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !payment) {
    return (
      <SidebarLayout navItems={navItems} title={t('payments.expensesTitle')}>
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error || t('payments.paymentNotFound')}</p>
        </div>
      </SidebarLayout>
    );
  }

  const st = STATUS_MAP[payment.status] ?? STATUS_MAP.draft;
  const isDraft = payment.status === 'draft';
  const isConfirmed = payment.status === 'confirmed';
  const isPaid = payment.status === 'paid';
  return (
    <SidebarLayout navItems={navItems} title={t('payments.expensesTitle')}>
      <button
        onClick={() => navigate('/financial/payments/expenses')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        {t('common.back')}
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{payment.consultantName}</h2>
          <p className="text-sm text-text-muted mt-1">
            {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
          </p>
        </div>
        <Badge variant={st.variant}>{t(st.label)}</Badge>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('common.project')}</TableHeader>
              <TableHeader>{t('common.date')}</TableHeader>
              <TableHeader>{t('common.description')}</TableHeader>
              <TableHeader>{t('expenses.category')}</TableHeader>
              <TableHeader className="text-right">{t('common.value')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(payment.items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-sm">{item.projectName}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(item.expenseDate)}</TableCell>
                <TableCell>{item.expenseDescription || '—'}</TableCell>
                <TableCell>{item.categoryName || '—'}</TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      <div className="mb-6 flex justify-end">
        <div className="rounded-xl border border-border bg-surface-1 px-5 py-3">
          <span className="text-sm text-text-muted mr-3">{t('common.total')}:</span>
          <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(payment.totalAmount)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">{t('common.notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!isDraft}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
            <Button onClick={handleSaveNotes} disabled={actionLoading} variant="secondary">
              {t('invoices.saveNotes')}
            </Button>
            <Button onClick={handleConfirm} disabled={actionLoading}>
              {t('common.confirm')}
            </Button>
            <Button onClick={handleDelete} disabled={actionLoading} variant="danger">
              {t('common.delete')}
            </Button>
          </>
        )}
        {isConfirmed && (
          <>
            <Button onClick={() => setPayModalOpen(true)} disabled={actionLoading}>
              {t('payments.pay')}
            </Button>
            <Button onClick={handleRevert} disabled={actionLoading} variant="secondary">
              {t('payments.revert')}
            </Button>
            <Button onClick={handleCancel} disabled={actionLoading} variant="danger">
              {t('common.cancel')}
            </Button>
          </>
        )}
        {isPaid && (
          <>
            <Button onClick={handleCancel} disabled={actionLoading} variant="danger">
              {t('common.cancel')}
            </Button>
            {payment.receiptFileId && (
              <Button onClick={handleDownloadReceipt} variant="secondary">
                <Download size={15} className="mr-1.5" />
                {t('common.downloadReceipt')}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Pay modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title={t('common.registerPayment')}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('common.receiptOptional')}
            </label>
            {receiptFileId ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary">
                <span className="truncate flex-1">{receiptFileName}</span>
                <button
                  type="button"
                  onClick={() => { setReceiptFileId(''); setReceiptFileName(''); }}
                  className="text-text-muted hover:text-danger transition-colors text-xs"
                >
                  {t('common.remove')}
                </button>
              </div>
            ) : (
              <FileUpload
                accept="image/*,application/pdf"
                maxSize={10 * 1024 * 1024}
                uploading={uploading}
                onUpload={async (file) => {
                  setUploading(true);
                  try {
                    const uploaded = await uploadFile(file, 'payments');
                    setReceiptFileId(uploaded.id);
                    setReceiptFileName(file.name);
                  } catch (err) {
                    addToast(formatApiError(err), 'error');
                  } finally {
                    setUploading(false);
                  }
                }}
                onError={(msg) => addToast(msg, 'error')}
              />
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handlePay} disabled={actionLoading || uploading}>
              {actionLoading ? t('common.processing') : t('common.confirmPayment')}
            </Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
