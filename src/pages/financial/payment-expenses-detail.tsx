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

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  confirmed: { label: 'Confirmado', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
};

export default function PaymentExpensesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
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
      addToast('Notas salvas.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    if (!id || !confirm('Confirmar este pagamento?')) return;
    setActionLoading(true);
    try {
      await paymentService.confirmPayment(id);
      await loadPayment();
      addToast('Pagamento confirmado.', 'success');
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
      addToast('Pagamento marcado como pago.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevert() {
    if (!id || !confirm('Reverter para rascunho?')) return;
    setActionLoading(true);
    try {
      await paymentService.revertPayment(id);
      await loadPayment();
      addToast('Pagamento revertido para rascunho.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm('Cancelar este pagamento? Esta ação não pode ser desfeita facilmente.')) return;
    setActionLoading(true);
    try {
      await paymentService.cancelPayment(id);
      await loadPayment();
      addToast('Pagamento cancelado.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Excluir este pagamento?')) return;
    setActionLoading(true);
    try {
      await paymentService.deletePayment(id);
      addToast('Pagamento excluído.', 'success');
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
      <SidebarLayout navItems={navItems} title="Pagamento de Despesas">
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
      <SidebarLayout navItems={navItems} title="Pagamento de Despesas">
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error || 'Pagamento não encontrado.'}</p>
        </div>
      </SidebarLayout>
    );
  }

  const st = STATUS_MAP[payment.status] ?? STATUS_MAP.draft;
  const isDraft = payment.status === 'draft';
  const isConfirmed = payment.status === 'confirmed';
  const isPaid = payment.status === 'paid';
  return (
    <SidebarLayout navItems={navItems} title="Pagamento de Despesas">
      <button
        onClick={() => navigate('/financial/payments/expenses')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">{payment.consultantName}</h2>
          <p className="text-sm text-text-muted mt-1">
            {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
          </p>
        </div>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Projeto</TableHeader>
              <TableHeader>Data</TableHeader>
              <TableHeader>Descrição</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader className="text-right">Valor</TableHeader>
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
          <span className="text-sm text-text-muted mr-3">Total:</span>
          <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(payment.totalAmount)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Notas</label>
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
              Salvar Notas
            </Button>
            <Button onClick={handleConfirm} disabled={actionLoading}>
              Confirmar
            </Button>
            <Button onClick={handleDelete} disabled={actionLoading} variant="danger">
              Excluir
            </Button>
          </>
        )}
        {isConfirmed && (
          <>
            <Button onClick={() => setPayModalOpen(true)} disabled={actionLoading}>
              Pagar
            </Button>
            <Button onClick={handleRevert} disabled={actionLoading} variant="secondary">
              Reverter
            </Button>
            <Button onClick={handleCancel} disabled={actionLoading} variant="danger">
              Cancelar
            </Button>
          </>
        )}
        {isPaid && (
          <>
            <Button onClick={handleCancel} disabled={actionLoading} variant="danger">
              Cancelar
            </Button>
            {payment.receiptFileId && (
              <Button onClick={handleDownloadReceipt} variant="secondary">
                <Download size={15} className="mr-1.5" />
                Download Comprovante
              </Button>
            )}
          </>
        )}
      </div>

      {/* Pay modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Registrar Pagamento">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Comprovante (opcional)
            </label>
            {receiptFileId ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary">
                <span className="truncate flex-1">{receiptFileName}</span>
                <button
                  type="button"
                  onClick={() => { setReceiptFileId(''); setReceiptFileName(''); }}
                  className="text-text-muted hover:text-danger transition-colors text-xs"
                >
                  Remover
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
              Cancelar
            </Button>
            <Button onClick={handlePay} disabled={actionLoading || uploading}>
              {actionLoading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
