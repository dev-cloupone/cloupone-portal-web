import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, Download } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Modal } from '../../components/ui/modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { RevertInvoiceModal } from '../../components/financial/revert-invoice-modal';
import * as invoiceService from '../../services/invoice.service';
import { listActiveBankAccounts, type BankAccountOption } from '../../services/bank-accounts.service';
import { formatApiError, apiFetch } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { Invoice, InvoiceLine } from '../../types/financial.types';
import { INVOICE_STATUS_MAP } from '../../constants/invoice-status';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface EditableHoursLine {
  id: string;
  consultantName: string;
  calculatedHours: string;
  appliedHours: string;
  originalRate: string;
  appliedRate: string;
}

interface EditableCustomLine {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function InvoiceServicesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [hoursLines, setHoursLines] = useState<EditableHoursLine[]>([]);
  const [installmentLines, setInstallmentLines] = useState<{ id: string; description: string; amount: string }[]>([]);
  const [customLines, setCustomLines] = useState<EditableCustomLine[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [revertModal, setRevertModal] = useState<'to-draft' | 'to-issued' | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Add custom line modal
  const [addLineModalOpen, setAddLineModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('');

  const loadInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
      setNotes(data.notes || '');
      const lines = data.lines || [];
      setHoursLines(
        lines.filter((l: InvoiceLine) => l.lineType === 'hours').map((l: InvoiceLine) => ({
          id: l.id,
          consultantName: l.consultantName ?? '-',
          calculatedHours: l.calculatedHours ?? '0',
          appliedHours: l.appliedHours,
          originalRate: l.originalRate ?? '0',
          appliedRate: l.appliedRate,
        })),
      );
      setInstallmentLines(
        lines.filter((l: InvoiceLine) => l.lineType === 'installment').map((l: InvoiceLine) => ({
          id: l.id,
          description: l.description ?? '',
          amount: l.subtotal,
        })),
      );
      setCustomLines(
        lines.filter((l: InvoiceLine) => l.lineType === 'custom').map((l: InvoiceLine) => ({
          id: l.id,
          description: l.description ?? '',
          quantity: l.appliedHours,    // API reuses appliedHours as quantity for custom lines
          unitPrice: l.appliedRate,   // API reuses appliedRate as unit price for custom lines
        })),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  useEffect(() => {
    listActiveBankAccounts().then(setBankAccounts).catch(() => {});
  }, []);

  function updateHoursLine(index: number, field: 'appliedHours' | 'appliedRate', value: string) {
    setHoursLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function updateInstallmentLine(index: number, field: 'description', value: string) {
    setInstallmentLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  function updateCustomLine(index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) {
    setCustomLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function calcSubtotal(hours: string, rate: string): number {
    return Math.round(Number(hours) * Number(rate) * 100) / 100;
  }

  function calcTotalHours(): number {
    return hoursLines.reduce((sum, l) => sum + Number(l.appliedHours), 0);
  }

  function calcTotalAmount(): number {
    const hoursTotal = hoursLines.reduce((sum, l) => sum + calcSubtotal(l.appliedHours, l.appliedRate), 0);
    const installmentTotal = installmentLines.reduce((sum, l) => sum + Number(l.amount), 0);
    const customTotal = customLines.reduce((sum, l) => sum + calcSubtotal(l.quantity, l.unitPrice), 0);
    return hoursTotal + installmentTotal + customTotal;
  }

  async function handleSave() {
    if (!id) return;
    setActionLoading(true);
    try {
      const allLines = [
        ...hoursLines.map((l) => ({ id: l.id, appliedHours: l.appliedHours, appliedRate: l.appliedRate })),
        // Installment lines: API reuses appliedHours/appliedRate schema (installments use appliedHours='1', appliedRate=amount)
        ...installmentLines.map((l) => ({ id: l.id, description: l.description, appliedHours: '1', appliedRate: l.amount })),
        // Custom lines: map quantity/unitPrice back to API's appliedHours/appliedRate fields
        ...customLines.map((l) => ({ id: l.id, appliedHours: l.quantity, appliedRate: l.unitPrice, description: l.description })),
      ];
      await invoiceService.updateLines(id, {
        lines: allLines,
        notes: notes || undefined,
      });
      await loadInvoice();
      addToast('Fatura salva.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleIssue() {
    if (!id || !confirm('Emitir esta fatura? Um número sequencial será atribuído.')) return;
    setActionLoading(true);
    try {
      const allLines = [
        ...hoursLines.map((l) => ({ id: l.id, appliedHours: l.appliedHours, appliedRate: l.appliedRate })),
        // Installment lines: API reuses appliedHours/appliedRate schema (installments use appliedHours='1', appliedRate=amount)
        ...installmentLines.map((l) => ({ id: l.id, description: l.description, appliedHours: '1', appliedRate: l.amount })),
        ...customLines.map((l) => ({ id: l.id, appliedHours: l.quantity, appliedRate: l.unitPrice, description: l.description })),
      ];
      await invoiceService.updateLines(id, {
        lines: allLines,
        notes: notes || undefined,
      });
      await invoiceService.issueInvoice(id);
      await loadInvoice();
      addToast('Fatura salva e emitida.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay() {
    if (!id || !confirm('Marcar esta fatura como paga?')) return;
    setActionLoading(true);
    try {
      await invoiceService.payInvoice(id);
      await loadInvoice();
      addToast('Fatura marcada como paga.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!id || !confirm('Cancelar esta fatura?')) return;
    setActionLoading(true);
    try {
      await invoiceService.cancelInvoice(id);
      await loadInvoice();
      addToast('Fatura cancelada.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Excluir esta fatura?')) return;
    setActionLoading(true);
    try {
      await invoiceService.deleteInvoice(id);
      addToast('Fatura excluída.', 'success');
      navigate('/financial/invoices/services');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      setActionLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!id || !selectedBankAccountId) return;
    setPdfLoading(true);
    try {
      const response = await apiFetch(`/invoices/services/${id}/pdf?bankAccountId=${selectedBankAccountId}`);
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

  async function handleRevertToDraft() {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.revertToDraft(id);
      await loadInvoice();
      addToast('Fatura revertida para rascunho.', 'success');
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
      addToast('Fatura revertida para emitida.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddCustomLine() {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.addCustomLine(id, {
        description: newDescription,
        quantity: newQuantity,
        unitPrice: newUnitPrice,
      });
      setAddLineModalOpen(false);
      setNewDescription('');
      setNewQuantity('');
      setNewUnitPrice('');
      await loadInvoice();
      addToast('Item adicional adicionado.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveCustomLine(lineId: string) {
    if (!id || !confirm('Remover este item?')) return;
    try {
      await invoiceService.removeCustomLine(id, lineId);
      await loadInvoice();
      addToast('Item removido.', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title="Fatura de Serviços">
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
      <SidebarLayout navItems={navItems} title="Fatura de Serviços">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-danger mb-4">{error || 'Fatura não encontrada.'}</p>
          <button
            type="button"
            onClick={() => navigate('/financial/invoices/services')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            Voltar para lista
          </button>
        </div>
      </SidebarLayout>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isIssued = invoice.status === 'issued';
  const isPaid = invoice.status === 'paid';
  const isFixedPrice = invoice.invoiceType === 'fixed_price';
  const status = INVOICE_STATUS_MAP[invoice.status] ?? INVOICE_STATUS_MAP.draft;

  return (
    <SidebarLayout navItems={navItems} title="Fatura de Serviços">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/services')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {invoice.invoiceNumber ? `Fatura Nº ${invoice.invoiceNumber}` : 'Rascunho'}
            <span className="mx-2 text-text-muted">—</span>
            <span className="text-lg">{invoice.projectName}</span>
            <span className="mx-2 text-text-muted">—</span>
            <span className="font-mono text-lg">{MONTH_NAMES[invoice.month - 1]}/{invoice.year}</span>
          </h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-sm text-text-muted mt-1">Cliente: {invoice.clientName}</p>
      </div>

      {/* Hours lines table */}
      {hoursLines.length > 0 && <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 mb-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Consultor</TableHeader>
              <TableHeader className="text-right">Horas Calculadas</TableHeader>
              <TableHeader className="text-right">Horas Aplicadas</TableHeader>
              <TableHeader className="text-right">Rate Original</TableHeader>
              <TableHeader className="text-right">Rate Aplicado</TableHeader>
              <TableHeader className="text-right">Subtotal</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {hoursLines.map((line, index) => (
              <TableRow key={line.id}>
                <TableCell>
                  <span className="font-medium text-sm">{line.consultantName}</span>
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
                      onChange={(e) => updateHoursLine(index, 'appliedHours', e.target.value)}
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
                      onChange={(e) => updateHoursLine(index, 'appliedRate', e.target.value)}
                      className="w-28 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  ) : (
                    <span className="font-mono">{formatCurrency(line.appliedRate)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatCurrency(calcSubtotal(line.appliedHours, line.appliedRate))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>}

      {/* Installment lines (fixed_price) */}
      {installmentLines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">Parcelas</h3>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Descrição</TableHeader>
                  <TableHeader className="text-right">Valor</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {installmentLines.map((line, index) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {isDraft ? (
                        <textarea
                          value={line.description}
                          onChange={(e) => updateInstallmentLine(index, 'description', e.target.value)}
                          className="w-full rounded-md border border-border bg-surface-0 px-2 py-1 text-sm resize-none"
                          rows={2}
                        />
                      ) : (
                        <span className="text-sm whitespace-pre-line">{line.description}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap">
                      {formatCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Custom lines table */}
      {(customLines.length > 0 || isDraft) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Itens Adicionais</h3>
            {isDraft && (
              <Button variant="secondary" size="sm" onClick={() => setAddLineModalOpen(true)}>
                <Plus size={14} className="mr-1" />
                Adicionar item
              </Button>
            )}
          </div>
          {customLines.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Descrição</TableHeader>
                    <TableHeader className="text-right">Quantidade</TableHeader>
                    <TableHeader className="text-right">Preço Unitário</TableHeader>
                    <TableHeader className="text-right">Subtotal</TableHeader>
                    {isDraft && <TableHeader className="w-16">Ações</TableHeader>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customLines.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {isDraft ? (
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateCustomLine(index, 'description', e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm">{line.description}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) => updateCustomLine(index, 'quantity', e.target.value)}
                            className="w-20 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono">{Number(line.quantity).toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isDraft ? (
                          <input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => updateCustomLine(index, 'unitPrice', e.target.value)}
                            className="w-28 ml-auto rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-right font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono">{formatCurrency(line.unitPrice)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        {formatCurrency(calcSubtotal(line.quantity, line.unitPrice))}
                      </TableCell>
                      {isDraft && (
                        <TableCell>
                          <button
                            onClick={() => handleRemoveCustomLine(line.id)}
                            className="rounded-md p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={15} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="mb-6 flex justify-end gap-6">
        {!isFixedPrice && (
          <div className="rounded-xl border border-border bg-surface-1 px-5 py-3">
            <span className="text-sm text-text-muted mr-3">Total Horas:</span>
            <span className="text-lg font-bold font-mono text-text-primary">{calcTotalHours().toFixed(2)}</span>
          </div>
        )}
        <div className="rounded-xl border border-border bg-surface-1 px-5 py-3">
          <span className="text-sm text-text-muted mr-3">Total Valor:</span>
          <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(calcTotalAmount())}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-surface-1 p-6 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Observações</h3>
        {isDraft ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações sobre a fatura..."
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
            <Button variant="secondary" onClick={handleIssue} disabled={actionLoading}>
              Emitir
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
              Excluir
            </Button>
          </>
        )}
        {isIssued && (
          <>
            <Button onClick={handlePay} disabled={actionLoading}>
              Marcar Paga
            </Button>
            <Button variant="secondary" onClick={() => setRevertModal('to-draft')} disabled={actionLoading}>
              Reverter para Rascunho
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
              <Download size={15} className="mr-1.5" />
              Download PDF
            </Button>
          </>
        )}
        {isPaid && (
          <>
            <Button variant="secondary" onClick={() => setRevertModal('to-issued')} disabled={actionLoading}>
              Reverter para Emitida
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
              <Download size={15} className="mr-1.5" />
              Download PDF
            </Button>
          </>
        )}
        {invoice.status === 'cancelled' && invoice.invoiceNumber && (
          <Button variant="secondary" onClick={() => setShowPdfModal(true)}>
            <Download size={15} className="mr-1.5" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Add custom line modal */}
      <Modal isOpen={addLineModalOpen} onClose={() => setAddLineModalOpen(false)} title="Adicionar Item Adicional">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Descrição</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              placeholder="Descrição do item"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Quantidade</label>
              <input
                type="number"
                step="0.01"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                placeholder="1.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Preço Unitário</label>
              <input
                type="number"
                step="0.01"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddLineModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCustomLine} disabled={actionLoading || !newDescription || !newQuantity || !newUnitPrice}>
              {actionLoading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      <RevertInvoiceModal
        isOpen={!!revertModal}
        onClose={() => setRevertModal(null)}
        onConfirm={revertModal === 'to-draft' ? handleRevertToDraft : handleRevertToIssued}
        type={revertModal ?? 'to-draft'}
        invoiceNumber={invoice.invoiceNumber}
      />

      <Modal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} title="Gerar PDF da Fatura">
        {bankAccounts.length === 0 ? (
          <p className="text-sm text-text-muted">Cadastre contas bancárias em Configurações.</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Conta para pagamento</label>
            <select
              value={selectedBankAccountId}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="">Selecione uma conta...</option>
              {bankAccounts.map((ba) => (
                <option key={ba.id} value={ba.id}>{ba.label}</option>
              ))}
            </select>
          </>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowPdfModal(false)}>Cancelar</Button>
          <Button onClick={handleDownloadPdf} disabled={!selectedBankAccountId || pdfLoading}>
            {pdfLoading ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
