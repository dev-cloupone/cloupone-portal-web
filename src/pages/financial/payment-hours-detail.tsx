import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Modal } from '../../components/ui/modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import * as paymentService from '../../services/consultant-payment.service';
import { uploadFile } from '../../services/uploads';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import { FileUpload } from '../../components/ui/file-upload';
import type { ConsultantPayment, ConsultantPaymentLine } from '../../types/financial.types';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const STATUS_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'Rascunho' },
  confirmed: { variant: 'warning', label: 'Confirmado' },
  paid: { variant: 'success', label: 'Pago' },
  cancelled: { variant: 'danger', label: 'Cancelado' },
};

interface EditableLine {
  id: string;
  projectName: string;
  calculatedHours: string;
  appliedHours: string;
  originalRate: string;
  appliedRate: string;
}

export default function PaymentHoursDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [payment, setPayment] = useState<ConsultantPayment | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      setNotes(data.notes || '');
      setLines(
        (data.lines || []).map((l: ConsultantPaymentLine) => ({
          id: l.id,
          projectName: l.projectName,
          calculatedHours: l.calculatedHours,
          appliedHours: l.appliedHours,
          originalRate: l.originalRate,
          appliedRate: l.appliedRate,
        })),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  function updateLine(index: number, field: 'appliedHours' | 'appliedRate', value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function calcSubtotal(line: EditableLine): number {
    return Number(line.appliedHours) * Number(line.appliedRate);
  }

  function calcTotal(): number {
    return lines.reduce((sum, l) => sum + calcSubtotal(l), 0);
  }

  async function handleSave() {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await paymentService.updateLines(id, {
        lines: lines.map((l) => ({ id: l.id, appliedHours: l.appliedHours, appliedRate: l.appliedRate })),
        notes: notes || undefined,
      });
      setPayment(updated);
      addToast('Pagamento salvo.', 'success');
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
      const updated = await paymentService.confirmPayment(id);
      setPayment(updated);
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
      const updated = await paymentService.payPayment(id, {
        receiptFileId: receiptFileId || undefined,
      });
      setPayment(updated);
      setPayModalOpen(false);
      setReceiptFileId('');
      setReceiptFileName('');
      addToast('Pagamento registrado.', 'success');
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
      const updated = await paymentService.revertPayment(id);
      setPayment(updated);
      addToast('Pagamento revertido para rascunho.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm('Cancelar este pagamento?')) return;
    setActionLoading(true);
    try {
      const updated = await paymentService.cancelPayment(id);
      setPayment(updated);
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
      navigate('/financial/payments/hours');
    } catch (err) {
      addToast(formatApiError(err), 'error');
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
      <SidebarLayout navItems={navItems} title="Pagamento de Horas">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </SidebarLayout>
    );
  }

  if (error || !payment) {
    return (
      <SidebarLayout navItems={navItems} title="Pagamento de Horas">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-danger mb-4">{error || 'Pagamento não encontrado.'}</p>
          <button
            type="button"
            onClick={() => navigate('/financial/payments/hours')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            Voltar para lista
          </button>
        </div>
      </SidebarLayout>
    );
  }

  const isDraft = payment.status === 'draft';
  const isConfirmed = payment.status === 'confirmed';
  const isPaid = payment.status === 'paid';
  const status = STATUS_MAP[payment.status] ?? STATUS_MAP.draft;

  return (
    <SidebarLayout navItems={navItems} title="Pagamento de Horas">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/payments/hours')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {payment.consultantName}
            <span className="mx-2 text-text-muted">—</span>
            <span className="font-mono">{MONTH_NAMES[payment.month - 1]}/{payment.year}</span>
          </h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {/* Lines table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Projeto</TableHeader>
              <TableHeader className="text-right">Horas Calculadas</TableHeader>
              <TableHeader className="text-right">Horas Aplicadas</TableHeader>
              <TableHeader className="text-right">Rate Original</TableHeader>
              <TableHeader className="text-right">Rate Aplicado</TableHeader>
              <TableHeader className="text-right">Subtotal</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={line.id}>
                <TableCell>
                  <span className="font-medium text-sm">{line.projectName}</span>
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {Number(line.calculatedHours).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {isDraft ? (
                    <input
                      type="number"
                      step="0.01"
                      value={line.appliedHours}
                      onChange={(e) => updateLine(index, 'appliedHours', e.target.value)}
                      className="w-24 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  ) : (
                    <span className="font-mono">{Number(line.appliedHours).toFixed(2)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(line.originalRate)}
                </TableCell>
                <TableCell className="text-right">
                  {isDraft ? (
                    <input
                      type="number"
                      step="0.01"
                      value={line.appliedRate}
                      onChange={(e) => updateLine(index, 'appliedRate', e.target.value)}
                      className="w-28 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  ) : (
                    <span className="font-mono">{formatCurrency(line.appliedRate)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(calcSubtotal(line))}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow>
              <TableCell colSpan={5} className="text-right">
                <span className="font-semibold text-sm text-text-primary">Total</span>
              </TableCell>
              <TableCell className="text-right font-mono font-semibold whitespace-nowrap">
                {formatCurrency(calcTotal())}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Observações</h3>
        {isDraft ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações sobre o pagamento..."
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{notes || 'Nenhuma observação.'}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="secondary" onClick={handleConfirm} disabled={actionLoading}>
              Confirmar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
              Excluir
            </Button>
          </>
        )}
        {isConfirmed && (
          <>
            <Button onClick={() => setPayModalOpen(true)} disabled={actionLoading}>
              Pagar
            </Button>
            <Button variant="secondary" onClick={handleRevert} disabled={actionLoading}>
              Reverter
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              Cancelar
            </Button>
          </>
        )}
        {isPaid && (
          <>
            {payment.receiptFileId && (
              <Button variant="secondary" onClick={handleDownloadReceipt}>
                Download Comprovante
              </Button>
            )}
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              Cancelar
            </Button>
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
