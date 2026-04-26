import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Paperclip, Upload, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import type { Expense, UpsertExpenseData, ProjectExpenseCategory, ExpenseTemplate } from '../../types/expense.types';
import type { ProjectAllocation } from '../../types/project.types';
import { apiFetch, BASE_URL } from '../../services/api';
import { useAuth } from '../../hooks/use-auth';

interface AllocatedProject {
  projectId: string;
  projectName: string;
  clientName: string;
}

interface ExpenseFormProps {
  date: string;
  expense?: Expense | null;
  projects: AllocatedProject[];
  categoriesByProject: Record<string, ProjectExpenseCategory[]>;
  allocationsByProject?: Record<string, ProjectAllocation[]>;
  templates?: ExpenseTemplate[];
  /** Project IDs that have the current date in an open period. */
  openProjectIds?: Set<string>;
  contextConsultantUserId?: string | null;
  contextProjectId?: string | null;
  onSave: (data: UpsertExpenseData) => Promise<void>;
  onProjectChange?: (projectId: string) => void;
  onManageTemplates?: () => void;
  onCancel: () => void;
}

export function ExpenseForm({
  date,
  expense = null,
  projects,
  categoriesByProject,
  allocationsByProject = {},
  templates = [],
  openProjectIds,
  contextConsultantUserId,
  contextProjectId,
  onSave,
  onProjectChange,
  onManageTemplates,
  onCancel,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const isGestorOrAdmin = user?.role === 'gestor' || user?.role === 'super_admin';

  const [projectId, setProjectId] = useState('');
  const [consultantUserId, setConsultantUserId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [kmQuantity, setKmQuantity] = useState('');
  const [clientChargeAmount, setClientChargeAmount] = useState('');
  const [receiptFileId, setReceiptFileId] = useState<string | null>(null);
  const [_receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [requiresReimbursement, setRequiresReimbursement] = useState(true);
  const [isChargeManuallySet, setIsChargeManuallySet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form
  useEffect(() => {
    if (expense) {
      setProjectId(expense.projectId);
      setConsultantUserId(expense.consultantUserId || '');
      setExpenseCategoryId(expense.expenseCategoryId || '');
      setDescription(expense.description || '');
      setAmount(expense.amount);
      setKmQuantity(expense.kmQuantity || '');
      setClientChargeAmount(expense.clientChargeAmount || '');
      setReceiptFileId(expense.receiptFileId);
      setReceiptUrl(expense.receiptUrl);
      setRequiresReimbursement(expense.requiresReimbursement);
      setIsChargeManuallySet(expense.clientChargeAmountManuallySet ?? false);
    } else {
      setProjectId(contextProjectId || (projects.length === 1 ? projects[0].projectId : ''));
      setConsultantUserId(contextConsultantUserId || '');
      setExpenseCategoryId('');
      setDescription('');
      setAmount('');
      setKmQuantity('');
      setClientChargeAmount('');
      setReceiptFileId(null);
      setReceiptUrl(null);
      setRequiresReimbursement(user?.role === 'consultor');
      setIsChargeManuallySet(false);
    }
    setError('');
  }, [expense, date, projects, user?.role, contextConsultantUserId, contextProjectId]);

  // Categories for the selected project
  const categories = useMemo(() => {
    if (!projectId) return [];
    return categoriesByProject[projectId] ?? [];
  }, [projectId, categoriesByProject]);

  // Allocations for the selected project (gestor/admin: consultant selector)
  const projectAllocations = useMemo(() => {
    if (!projectId || !isGestorOrAdmin) return [];
    return allocationsByProject[projectId] ?? [];
  }, [projectId, isGestorOrAdmin, allocationsByProject]);

  // Reset category and consultant when project changes
  useEffect(() => {
    if (expenseCategoryId && categories.length > 0) {
      const exists = categories.find(c => c.id === expenseCategoryId);
      if (!exists) setExpenseCategoryId('');
    }
    if (consultantUserId && projectAllocations.length > 0) {
      const exists = projectAllocations.find(a => a.userId === consultantUserId);
      if (!exists) setConsultantUserId('');
    }
  }, [categories, expenseCategoryId, projectAllocations, consultantUserId]);

  const isEditable = !expense || expense.status !== 'approved';
  const isContextMode = !!(contextConsultantUserId && contextProjectId);

  const selectedCategory = categories.find(c => c.id === expenseCategoryId);
  const isKmCategory = selectedCategory?.isKmCategory ?? false;
  const isOverBudget = selectedCategory?.maxAmount && amount && Number(amount) > Number(selectedCategory.maxAmount);
  const needsReceipt = selectedCategory?.requiresReceipt && !receiptFileId;

  // Auto-calculate amount for KM categories
  useEffect(() => {
    if (isKmCategory && kmQuantity && selectedCategory?.kmRate) {
      const computed = (Number(kmQuantity) * Number(selectedCategory.kmRate)).toFixed(2);
      setAmount(computed);
    }
  }, [isKmCategory, kmQuantity, selectedCategory?.kmRate]);

  // Default client charge = amount (unless manually set)
  useEffect(() => {
    if (!isChargeManuallySet && amount) {
      setClientChargeAmount(amount);
    }
  }, [amount, isChargeManuallySet]);

  function handleApplyTemplate(templateId: string) {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (template.expenseCategoryId) {
      // Template references a global category template ID — resolve to project category
      const projectCategory = categories.find(c => c.templateId === template.expenseCategoryId);
      if (projectCategory) {
        setExpenseCategoryId(projectCategory.id);
      }
    }
    if (template.description) setDescription(template.description);
    if (template.amount) setAmount(template.amount);
    setRequiresReimbursement(template.requiresReimbursement);
  }

  async function handleUploadReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/uploads/expenses', { method: 'POST', body: formData });
      const data = await res.json();
      setReceiptFileId(data.id);
      setReceiptUrl(data.url);
    } catch {
      setError('Erro ao enviar comprovante.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !amount) return;
    if (isGestorOrAdmin && !consultantUserId) return;
    if (isKmCategory && !kmQuantity) return;
    if (needsReceipt) {
      setError('Esta categoria exige comprovante. Anexe um comprovante antes de salvar.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        id: expense?.id,
        projectId,
        consultantUserId: isGestorOrAdmin && consultantUserId ? consultantUserId : null,
        expenseCategoryId: expenseCategoryId || null,
        date,
        description: description.trim() || null,
        amount,
        kmQuantity: isKmCategory ? kmQuantity : null,
        clientChargeAmount: isGestorOrAdmin ? clientChargeAmount || null : null,
        receiptFileId,
        requiresReimbursement,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar despesa.');
    } finally {
      setIsSaving(false);
    }
  }

  const projectOptions = projects
    .filter(p => !openProjectIds || openProjectIds.has(p.projectId))
    .map(p => ({
      value: p.projectId,
      label: `${p.projectName} (${p.clientName})`,
    }));

  const consultantOptions = projectAllocations.map(a => ({
    value: a.userId,
    label: `${a.userName} (${a.userEmail})`,
  }));

  const categoryOptions = categories
    .filter(c => c.isActive)
    .map(c => ({
      value: c.id,
      label: c.maxAmount ? `${c.name} (teto R$ ${Number(c.maxAmount).toFixed(2)})` : c.name,
    }));

  const templateOptions = templates.map(t => ({
    value: t.id,
    label: t.amount ? `${t.name} (R$ ${Number(t.amount).toFixed(2)})` : t.name,
  }));

  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });

  const title = expense ? 'Editar Despesa' : 'Nova Despesa';
  const isReimbursementEditable = isEditable && (user?.role !== 'consultor' || !expense);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" /> Voltar
        </button>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        {onManageTemplates && (
          <button
            type="button"
            onClick={onManageTemplates}
            className="ml-auto flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            title="Gerenciar templates"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted mb-4 capitalize">{dateDisplay}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rejection comment */}
        {expense?.status === 'rejected' && expense.rejectionComment && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-danger" />
              <span className="text-xs font-semibold uppercase tracking-wider text-danger">Motivo da rejeição</span>
            </div>
            <p className="text-sm text-text-primary">{expense.rejectionComment}</p>
          </div>
        )}

        {/* Template selector - only for new expenses */}
        {!expense && templates.length > 0 && isEditable && (
          <Select
            label="Template"
            value=""
            onChange={handleApplyTemplate}
            options={templateOptions}
            placeholder="Aplicar template..."
          />
        )}

        <Select
          label="Projeto"
          value={projectId}
          onChange={(v) => { setProjectId(v); onProjectChange?.(v); }}
          options={projectOptions}
          placeholder="Selecione um projeto"
          disabled={!isEditable || isContextMode}
          required
        />

        {/* Consultant selector (gestor/admin only) */}
        {isGestorOrAdmin && projectId && (
          <Select
            label="Consultor"
            value={consultantUserId}
            onChange={setConsultantUserId}
            options={consultantOptions}
            placeholder={consultantOptions.length === 0 ? 'Nenhum consultor alocado' : 'Selecione o consultor'}
            disabled={!isEditable || consultantOptions.length === 0 || isContextMode}
            required
          />
        )}

        <Select
          label="Categoria"
          value={expenseCategoryId}
          onChange={setExpenseCategoryId}
          options={categoryOptions}
          placeholder={projectId ? 'Selecione uma categoria' : 'Selecione um projeto primeiro'}
          disabled={!isEditable || !projectId}
        />

        {/* Category info */}
        {selectedCategory && (
          <div className="flex flex-wrap gap-2 text-xs text-text-tertiary">
            {selectedCategory.maxAmount && (
              <span>Teto: R$ {Number(selectedCategory.maxAmount).toFixed(2)}</span>
            )}
            {selectedCategory.isKmCategory && selectedCategory.kmRate && (
              <span className="text-accent">R$ {Number(selectedCategory.kmRate).toFixed(2)} por km</span>
            )}
            {selectedCategory.requiresReceipt && (
              <span className="text-warning">Exige comprovante</span>
            )}
          </div>
        )}

        {/* KM Quantity (only for KM categories) */}
        {isKmCategory && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Quantidade de KM
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={kmQuantity}
              onChange={(e) => setKmQuantity(e.target.value)}
              disabled={!isEditable}
              required
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40"
              placeholder="0.0"
            />
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isEditable || isKmCategory}
            required
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40"
            placeholder="0.00"
          />
          {isKmCategory && (
            <p className="text-xs text-text-muted">Valor calculado automaticamente com base no KM</p>
          )}
          {isOverBudget && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle size={10} /> Acima do teto da categoria
            </p>
          )}
        </div>

        {/* Client charge amount (gestor/admin only) */}
        {isGestorOrAdmin && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Valor de cobrança ao cliente (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={clientChargeAmount}
              onChange={(e) => { setClientChargeAmount(e.target.value); setIsChargeManuallySet(true); }}
              disabled={!isEditable}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40"
              placeholder="0.00"
            />
            <p className="text-xs text-text-muted">Default = valor da despesa. Edite para definir manualmente.</p>
          </div>
        )}

        {/* Description (optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={!isEditable}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none disabled:opacity-40"
            placeholder="Descreva a despesa..."
          />
          <div className="text-right text-caption text-text-muted">
            {description.length}/500
          </div>
        </div>

        {/* Receipt upload */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Comprovante {needsReceipt && <span className="text-warning">(obrigatório)</span>}
          </label>
          {receiptFileId ? (
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 border border-border px-3 py-2">
              <Paperclip size={14} className="text-accent shrink-0" />
              <a href={`${BASE_URL}/uploads/download/${receiptFileId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline truncate flex-1">
                Ver comprovante
              </a>
              {isEditable && (
                <button type="button" onClick={() => { setReceiptFileId(null); setReceiptUrl(null); }} className="text-xs text-danger hover:underline">
                  Remover
                </button>
              )}
            </div>
          ) : (
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${isEditable ? 'border-border hover:border-accent/50 hover:bg-surface-2/50' : 'opacity-40 cursor-not-allowed'}`}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleUploadReceipt}
                disabled={!isEditable || isUploading}
                className="hidden"
              />
              <Upload size={20} className="mb-1 text-text-muted" />
              <p className="text-xs text-text-tertiary">
                {isUploading ? 'Enviando...' : 'Clique para anexar comprovante'}
              </p>
              <p className="mt-0.5 text-[10px] text-text-muted">Máximo 10MB</p>
            </label>
          )}
        </div>

        {/* Requires reimbursement */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requiresReimbursement"
            checked={requiresReimbursement}
            onChange={(e) => setRequiresReimbursement(e.target.checked)}
            disabled={!isReimbursementEditable}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
          />
          <label htmlFor="requiresReimbursement" className="text-sm text-text-secondary">
            Requer reembolso ao consultor
          </label>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isSaving} className="flex-1">
            Cancelar
          </Button>
          {isEditable && (
            <Button type="submit" disabled={isSaving || !projectId || !amount || (isKmCategory && !kmQuantity) || !!needsReceipt || (isGestorOrAdmin && !consultantUserId)} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
}
