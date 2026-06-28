import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Layers, Pencil, Trash2, FileText } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Modal } from '../../components/ui/modal';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as projectService from '../../services/project.service';
import * as installmentService from '../../services/installment.service';
import * as invoiceService from '../../services/invoice.service';
import type { Project, ProjectInstallment } from '../../types/project.types';
import { useTranslation } from 'react-i18next';
import { getBillingTypeOptions, INSTALLMENT_STATUS_LABELS, INSTALLMENT_STATUS_VARIANTS } from '../../constants/project.constants';
import { formatCurrency, parseCurrencyInput } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

export default function ProjectFinancialPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const locale = useLocaleStore((s) => s.locale);

  const [project, setProject] = useState<Project | null>(null);
  const [installments, setInstallments] = useState<ProjectInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Billing config form
  const [billingType, setBillingType] = useState('hourly');
  const [billingRate, setBillingRate] = useState('');
  const [billingRateDisplay, setBillingRateDisplay] = useState('');
  const [fixedPriceTotal, setFixedPriceTotal] = useState('');
  const [fixedPriceTotalDisplay, setFixedPriceTotalDisplay] = useState('');
  const [budgetHours, setBudgetHours] = useState('');
  const [budgetType, setBudgetType] = useState('monthly');

  // Create installment modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ description: '', amount: '', dueDate: '' });

  // Batch modal
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({ count: '', startDate: '' });

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<ProjectInstallment | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', dueDate: '' });

  // Invoice generation
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceYear, setInvoiceYear] = useState(String(new Date().getFullYear()));
  const [invoiceMonth, setInvoiceMonth] = useState(String(new Date().getMonth() + 1));
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const proj = await projectService.getProject(id!);
      setProject(proj);
      setBillingType(proj.billingType || 'hourly');
      const rate = proj.billingRate ? String(proj.billingRate) : '';
      setBillingRate(rate);
      setBillingRateDisplay(proj.billingRate ? formatCurrency(Number(proj.billingRate)) : '');
      const fixed = proj.fixedPriceTotal ? String(proj.fixedPriceTotal) : '';
      setFixedPriceTotal(fixed);
      setFixedPriceTotalDisplay(proj.fixedPriceTotal ? formatCurrency(Number(proj.fixedPriceTotal)) : '');
      setBudgetHours(proj.budgetHours ? String(proj.budgetHours) : '');
      setBudgetType(proj.budgetType || 'monthly');

      if (proj.billingType === 'fixed_price') {
        const result = await installmentService.listInstallments(id!);
        setInstallments(result.data);
        setSelectedIds(new Set());
      }
    } catch {
      addToast(t('projects.loadFinancialError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  async function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data: Record<string, unknown> = { billingType };
      if (billingType === 'hourly') {
        data.billingRate = parseCurrencyInput(billingRate);
        data.fixedPriceTotal = null;
      } else {
        data.fixedPriceTotal = parseCurrencyInput(fixedPriceTotal);
        data.billingRate = 0;
      }
      data.budgetHours = budgetHours ? Number(budgetHours) : undefined;
      data.budgetType = budgetType || undefined;
      await projectService.updateProject(id!, data);
      addToast(t('projects.billingConfigSaved'), 'success');
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInstallment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await installmentService.createInstallment(id!, {
        amount: parseCurrencyInput(createForm.amount),
        description: createForm.description || undefined,
        dueDate: createForm.dueDate || undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({ description: '', amount: '', dueDate: '' });
      addToast(t('projects.installmentCreated'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    try {
      const total = parseCurrencyInput(fixedPriceTotal);
      const count = Number(batchForm.count);
      if (!total || total <= 0) {
        addToast(t('projects.contractTotalNotDefined'), 'error');
        return;
      }
      const amount = Math.round((total / count) * 100) / 100;
      await installmentService.createInstallmentBatch(id!, {
        count,
        amount,
        startDate: batchForm.startDate || undefined,
      });
      setIsBatchOpen(false);
      setBatchForm({ count: '', startDate: '' });
      addToast(t('projects.batchCreated'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  function openEdit(inst: ProjectInstallment) {
    setEditingInstallment(inst);
    setEditForm({
      description: inst.description || '',
      amount: formatCurrency(inst.amount),
      dueDate: inst.dueDate || '',
    });
    setIsEditOpen(true);
  }

  async function handleEditInstallment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInstallment) return;
    try {
      await installmentService.updateInstallment(id!, editingInstallment.id, {
        description: editForm.description || undefined,
        amount: parseCurrencyInput(editForm.amount),
        dueDate: editForm.dueDate || undefined,
      });
      setIsEditOpen(false);
      addToast(t('projects.installmentUpdated'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleDelete(inst: ProjectInstallment) {
    if (!confirm(t('projects.deleteInstallment', { name: inst.description || `#${inst.installmentNumber}` }))) return;
    try {
      await installmentService.removeInstallment(id!, inst.id);
      addToast(t('projects.installmentDeleted'), 'success');
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  function toggleSelected(instId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(instId)) next.delete(instId);
      else next.add(instId);
      return next;
    });
  }

  const pendingInstallments = installments.filter(i => i.status === 'pending');
  const allPendingSelected = pendingInstallments.length > 0 && pendingInstallments.every(i => selectedIds.has(i.id));

  function toggleAllPending() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingInstallments.map(i => i.id)));
    }
  }

  const selectedInstallments = installments.filter(i => selectedIds.has(i.id));
  const selectedTotal = selectedInstallments.reduce((sum, i) => sum + Number(i.amount), 0);

  async function handleGenerateInvoice() {
    setGeneratingInvoice(true);
    try {
      const invoice = await invoiceService.generateFromInstallments({
        projectId: id!,
        installmentIds: Array.from(selectedIds),
        year: Number(invoiceYear),
        month: Number(invoiceMonth),
      });
      setIsInvoiceModalOpen(false);
      setSelectedIds(new Set());
      addToast(t('projects.invoiceGenerated'), 'success');
      navigate(`/financial/invoices/services/${invoice.id}`);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setGeneratingInvoice(false);
    }
  }

  const totalInstallments = installments.reduce((sum, i) => sum + Number(i.amount), 0);

  if (loading || !project) {
    return (
      <SidebarLayout navItems={navItems} title="Financeiro">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-surface-2" />)}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} title="Financeiro">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate(`/admin/projects/${id}`)} aria-label={t('common.back')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
          <p className="text-sm text-text-tertiary">{t('projects.financialConfig')}</p>
        </div>
      </div>

      {/* Section 1: Billing Config */}
      <form onSubmit={handleSaveBilling} className="max-w-2xl space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-text-primary">{t('projects.billingConfig')}</h2>

        <Select
          label={t('projects.billingType')}
          options={getBillingTypeOptions().map(o => ({ ...o, label: t(o.label) }))}
          value={billingType}
          onChange={(v) => setBillingType(v)}
        />

        {billingType === 'hourly' ? (
          <>
            <Input
              label={t('projects.billingRateClient')}
              type="text"
              value={billingRateDisplay}
              onFocus={() => setBillingRateDisplay(billingRate)}
              onChange={(e) => { setBillingRateDisplay(e.target.value); setBillingRate(e.target.value); }}
              onBlur={() => {
                const num = parseCurrencyInput(billingRateDisplay);
                setBillingRate(String(num));
                setBillingRateDisplay(num > 0 ? formatCurrency(num) : '');
              }}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('projects.budgetHours')}
                type="number"
                value={budgetHours}
                onChange={(e) => setBudgetHours(e.target.value)}
              />
              <Select
                label={t('projects.budgetType')}
                options={[{ value: 'monthly', label: t('projects.budgetMonthly') }, { value: 'total', label: t('projects.budgetTotal') }]}
                value={budgetType}
                onChange={(v) => setBudgetType(v)}
              />
            </div>
          </>
        ) : (
          <Input
            label={t('projects.fixedPriceTotal')}
            type="text"
            value={fixedPriceTotalDisplay}
            onFocus={() => setFixedPriceTotalDisplay(fixedPriceTotal)}
            onChange={(e) => { setFixedPriceTotalDisplay(e.target.value); setFixedPriceTotal(e.target.value); }}
            onBlur={() => {
              const num = parseCurrencyInput(fixedPriceTotalDisplay);
              setFixedPriceTotal(String(num));
              setFixedPriceTotalDisplay(num > 0 ? formatCurrency(num) : '');
            }}
            required
          />
        )}

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </form>

      {/* Section 2: Installments (only for fixed_price) */}
      {billingType === 'fixed_price' && project.billingType !== 'fixed_price' && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 mb-4">
          <p className="text-sm text-text-secondary">
            Salve a configuração de cobrança acima para gerenciar parcelas.
          </p>
        </div>
      )}
      {project.billingType === 'fixed_price' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">{t('projects.installments')}</h2>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button onClick={() => setIsInvoiceModalOpen(true)}>
                  <FileText size={16} className="mr-2" /> Gerar Fatura ({selectedIds.size})
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setBatchForm({ count: '', startDate: '' }); setIsBatchOpen(true); }}>
                <Layers size={16} className="mr-2" /> {t('projects.generateBatch')}
              </Button>
              <Button onClick={() => { setCreateForm({ description: '', amount: '', dueDate: '' }); setIsCreateOpen(true); }}>
                <Plus size={16} className="mr-2" /> {t('projects.installment')}
              </Button>
            </div>
          </div>

          {installments.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t('projects.noInstallments')}</p>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader className="w-10">
                      <input type="checkbox" checked={allPendingSelected} onChange={toggleAllPending} disabled={pendingInstallments.length === 0} />
                    </TableHeader>
                    <TableHeader>#</TableHeader>
                    <TableHeader>{t('common.description')}</TableHeader>
                    <TableHeader>{t('common.value')}</TableHeader>
                    <TableHeader>{t('common.dueDate')}</TableHeader>
                    <TableHeader>{t('common.status')}</TableHeader>
                    <TableHeader>{t('common.actions')}</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {installments.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell>
                        {inst.status === 'pending' && (
                          <input type="checkbox" checked={selectedIds.has(inst.id)} onChange={() => toggleSelected(inst.id)} />
                        )}
                      </TableCell>
                      <TableCell>{inst.installmentNumber}</TableCell>
                      <TableCell>{inst.description || '—'}</TableCell>
                      <TableCell>{formatCurrency(inst.amount)}</TableCell>
                      <TableCell>
                        {inst.dueDate ? new Date(inst.dueDate + 'T12:00:00').toLocaleDateString(locale) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={INSTALLMENT_STATUS_VARIANTS[inst.status] || 'default'}>
                          {t(INSTALLMENT_STATUS_LABELS[inst.status] || 'projects.installmentPending')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inst.status === 'pending' && (
                            <>
                              <IconButton onClick={() => openEdit(inst)} aria-label={t('common.edit')}>
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton onClick={() => handleDelete(inst)} aria-label={t('common.delete')}>
                                <Trash2 size={14} />
                              </IconButton>
                            </>
                          )}
                          {inst.invoiceId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/financial/invoices/services/${inst.invoiceId}`)}
                            >
                              Ver Fatura
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-sm text-text-secondary">
                Total das parcelas: <strong>{formatCurrency(totalInstallments)}</strong>
                {fixedPriceTotal && (
                  <span className="ml-2 text-text-tertiary">
                    / {formatCurrency(parseCurrencyInput(fixedPriceTotal))} (contrato)
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Installment Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('projects.newInstallment')}>
        <form onSubmit={handleCreateInstallment} className="space-y-4">
          <Input label={t('common.description')} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          <Input
            label={t('common.value')}
            type="text"
            value={createForm.amount}
            onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
            onBlur={() => {
              const num = parseCurrencyInput(createForm.amount);
              setCreateForm((f) => ({ ...f, amount: num > 0 ? formatCurrency(num) : '' }));
            }}
            required
          />
          <Input label={t('common.dueDate')} type="date" value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} />
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Batch Modal */}
      <Modal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} title={t('projects.batchModal')}>
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <Input label={t('projects.batchCount')} type="number" min="1" max="60" value={batchForm.count} onChange={(e) => setBatchForm({ ...batchForm, count: e.target.value })} required />
          {Number(batchForm.count) > 0 && Number(fixedPriceTotal) > 0 && (
            <p className="text-sm text-text-secondary">
              Valor por parcela: <strong>{formatCurrency(parseCurrencyInput(fixedPriceTotal) / Number(batchForm.count))}</strong>
            </p>
          )}
          <Input label={t('projects.batchFirstDueDate')} type="date" value={batchForm.startDate} onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })} />
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsBatchOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.generate')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Installment Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={t('projects.editInstallment')}>
        <form onSubmit={handleEditInstallment} className="space-y-4">
          <Input label={t('common.description')} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <Input
            label={t('common.value')}
            type="text"
            value={editForm.amount}
            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            onBlur={() => {
              const num = parseCurrencyInput(editForm.amount);
              setEditForm((f) => ({ ...f, amount: num > 0 ? formatCurrency(num) : '' }));
            }}
            required
          />
          <Input label={t('common.dueDate')} type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title={t('projects.generateInvoiceModal')}>
        <div className="space-y-4">
          <div className="text-sm text-text-secondary">
            <p className="mb-2"><strong>{selectedInstallments.length}</strong> parcela(s) selecionada(s):</p>
            <ul className="list-disc list-inside space-y-1">
              {selectedInstallments.map(i => (
                <li key={i.id}>{i.description || `Parcela ${i.installmentNumber}`} — {formatCurrency(i.amount)}</li>
              ))}
            </ul>
            <p className="mt-3 font-semibold">Total: {formatCurrency(selectedTotal)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.year')} type="number" value={invoiceYear} onChange={(e) => setInvoiceYear(e.target.value)} required />
            <Select
              label="Mês"
              options={[
                { value: '1', label: t('months.january') }, { value: '2', label: t('months.february') },
                { value: '3', label: t('months.march') }, { value: '4', label: t('months.april') },
                { value: '5', label: t('months.may') }, { value: '6', label: t('months.june') },
                { value: '7', label: t('months.july') }, { value: '8', label: t('months.august') },
                { value: '9', label: t('months.september') }, { value: '10', label: t('months.october') },
                { value: '11', label: t('months.november') }, { value: '12', label: t('months.december') },
              ]}
              value={invoiceMonth}
              onChange={(v) => setInvoiceMonth(v)}
            />
          </div>
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsInvoiceModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleGenerateInvoice} disabled={generatingInvoice}>{generatingInvoice ? t('common.generating') : t('projects.generateDraft')}</Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
