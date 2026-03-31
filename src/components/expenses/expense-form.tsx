import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Paperclip, Upload, Bookmark, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import type { Expense, UpsertExpenseData, ExpenseCategory, ExpenseTemplate } from '../../types/expense.types';
import { apiFetch, BASE_URL } from '../../services/api';

interface AllocatedProject {
  projectId: string;
  projectName: string;
  clientName: string;
}

interface ExpenseFormProps {
  date: string;
  expense?: Expense | null;
  projects: AllocatedProject[];
  categories: ExpenseCategory[];
  templates?: ExpenseTemplate[];
  onSave: (data: UpsertExpenseData) => Promise<void>;
  onSaveAsTemplate?: (data: { name: string; expenseCategoryId?: string | null; description?: string; amount?: string; requiresReimbursement?: boolean }) => Promise<void>;
  onManageTemplates?: () => void;
  onCancel: () => void;
}

export function ExpenseForm({
  date,
  expense = null,
  projects,
  categories,
  templates = [],
  onSave,
  onSaveAsTemplate,
  onManageTemplates,
  onCancel,
}: ExpenseFormProps) {
  const [projectId, setProjectId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptFileId, setReceiptFileId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [requiresReimbursement, setRequiresReimbursement] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Initialize form
  useEffect(() => {
    if (expense) {
      setProjectId(expense.projectId);
      setExpenseCategoryId(expense.expenseCategoryId || '');
      setDescription(expense.description);
      setAmount(expense.amount);
      setReceiptFileId(expense.receiptFileId);
      setReceiptUrl(expense.receiptUrl);
      setRequiresReimbursement(expense.requiresReimbursement);
    } else {
      setProjectId(projects.length === 1 ? projects[0].projectId : '');
      setExpenseCategoryId('');
      setDescription('');
      setAmount('');
      setReceiptFileId(null);
      setReceiptUrl(null);
      setRequiresReimbursement(true);
    }
    setError('');
    setShowSaveTemplate(false);
  }, [expense, date, projects]);

  const isEditable = !expense || expense.status === 'draft' || expense.status === 'rejected';

  const selectedCategory = categories.find(c => c.id === expenseCategoryId);
  const isOverBudget = selectedCategory?.maxAmount && amount && Number(amount) > Number(selectedCategory.maxAmount);
  const needsReceipt = selectedCategory?.requiresReceipt && !receiptFileId;

  function handleApplyTemplate(templateId: string) {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (template.expenseCategoryId) setExpenseCategoryId(template.expenseCategoryId);
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
      const res = await apiFetch('/uploads', { method: 'POST', body: formData });
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
    if (!projectId || !description.trim() || !amount) return;

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        id: expense?.id,
        projectId,
        expenseCategoryId: expenseCategoryId || null,
        date,
        description: description.trim(),
        amount,
        receiptFileId,
        requiresReimbursement,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar despesa.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsTemplate() {
    if (!templateName.trim() || !onSaveAsTemplate) return;
    setIsSavingTemplate(true);
    try {
      await onSaveAsTemplate({
        name: templateName.trim(),
        expenseCategoryId: expenseCategoryId || null,
        description: description.trim() || undefined,
        amount: amount || undefined,
        requiresReimbursement,
      });
      setShowSaveTemplate(false);
      setTemplateName('');
    } catch {
      setError('Erro ao salvar template.');
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const projectOptions = projects.map(p => ({
    value: p.projectId,
    label: `${p.projectName} (${p.clientName})`,
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
              <span className="text-xs font-semibold uppercase tracking-wider text-danger">Motivo da rejeicao</span>
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
          onChange={setProjectId}
          options={projectOptions}
          placeholder="Selecione um projeto"
          disabled={!isEditable}
          required
        />

        <Select
          label="Categoria"
          value={expenseCategoryId}
          onChange={setExpenseCategoryId}
          options={categoryOptions}
          placeholder="Selecione uma categoria"
          disabled={!isEditable}
        />

        {/* Category info */}
        {selectedCategory && (
          <div className="flex flex-wrap gap-2 text-xs text-text-tertiary">
            {selectedCategory.maxAmount && (
              <span>Teto: R$ {Number(selectedCategory.maxAmount).toFixed(2)}</span>
            )}
            {selectedCategory.requiresReceipt && (
              <span className="text-warning">Exige comprovante</span>
            )}
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
            disabled={!isEditable}
            required
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40"
            placeholder="0.00"
          />
          {isOverBudget && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle size={10} /> Acima do teto da categoria
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Descricao
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={!isEditable}
            required
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
            disabled={!isEditable}
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
            <Button type="submit" disabled={isSaving || !projectId || !description.trim() || !amount} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>

        {/* Save as template */}
        {onSaveAsTemplate && isEditable && (expenseCategoryId || description || amount) && (
          <div className="border-t border-border pt-3">
            {!showSaveTemplate ? (
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors"
              >
                <Bookmark size={12} /> Salvar como template
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  maxLength={100}
                  placeholder="Nome do template..."
                  className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}
                    disabled={isSavingTemplate}
                    className="flex-1 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    disabled={isSavingTemplate || !templateName.trim()}
                    className="flex-1 text-xs"
                  >
                    {isSavingTemplate ? 'Salvando...' : 'Salvar Template'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
