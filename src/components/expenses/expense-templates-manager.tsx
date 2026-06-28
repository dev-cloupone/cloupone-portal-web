import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import type { ExpenseTemplate, ExpenseCategory, CreateExpenseTemplateData } from '../../types/expense.types';

interface ExpenseTemplatesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ExpenseTemplate[];
  categories: ExpenseCategory[];
  onCreate: (data: CreateExpenseTemplateData) => Promise<void>;
  onUpdate: (id: string, data: Partial<CreateExpenseTemplateData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ExpenseTemplatesManager({
  isOpen,
  onClose,
  templates,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: ExpenseTemplatesManagerProps) {
  const { t } = useTranslation();
  const [editingTemplate, setEditingTemplate] = useState<ExpenseTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [requiresReimbursement, setRequiresReimbursement] = useState(false);

  const categoryOptions = categories
    .filter(c => c.isActive)
    .map(c => ({ value: c.id, label: c.name }));

  function resetForm() {
    setName('');
    setExpenseCategoryId('');
    setDescription('');
    setAmount('');
    setRequiresReimbursement(false);
    setEditingTemplate(null);
    setIsCreating(false);
  }

  function startCreate() {
    resetForm();
    setIsCreating(true);
  }

  function startEdit(template: ExpenseTemplate) {
    setName(template.name);
    setExpenseCategoryId(template.expenseCategoryId || '');
    setDescription(template.description || '');
    setAmount(template.amount || '');
    setRequiresReimbursement(template.requiresReimbursement);
    setEditingTemplate(template);
    setIsCreating(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const data: CreateExpenseTemplateData = {
        name: name.trim(),
        expenseCategoryId: expenseCategoryId || null,
        description: description.trim() || undefined,
        amount: amount || undefined,
        requiresReimbursement,
      };

      if (editingTemplate) {
        await onUpdate(editingTemplate.id, data);
      } else {
        await onCreate(data);
      }
      resetForm();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch {
      // Error handled by parent
    } finally {
      setDeletingId(null);
    }
  }

  const showForm = isCreating;
  const formTitle = editingTemplate ? t('expenses.editTemplate') : t('expenses.newTemplate');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('expenses.templateTitle')}>
      {showForm ? (
        <div className="space-y-4">
          <p className="text-xs text-text-muted font-medium">{formTitle}</p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('expenses.templateNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder={t('expenses.templateNamePlaceholder')}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>

          <Select
            label={t('expenses.category')}
            value={expenseCategoryId}
            onChange={setExpenseCategoryId}
            options={categoryOptions}
            placeholder={t('expenses.selectCategory')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('expenses.templateAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('expenses.templateDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none"
              placeholder={t('expenses.templateDescriptionPlaceholder')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tmplReimbursement"
              checked={requiresReimbursement}
              onChange={(e) => setRequiresReimbursement(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
            />
            <label htmlFor="tmplReimbursement" className="text-sm text-text-secondary">
              {t('expenses.templateRequiresReimbursement')}
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={resetForm} disabled={isSaving} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving || !name.trim()} className="flex-1">
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">
              {t('expenses.noTemplates')}
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{tpl.name}</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      {tpl.categoryName && <span>{tpl.categoryName}</span>}
                      {tpl.amount && <span>R$ {Number(tpl.amount).toFixed(2)}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(tpl)}
                    className="p-1.5 text-text-muted hover:text-accent transition-colors shrink-0"
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tpl.id)}
                    disabled={deletingId === tpl.id}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors shrink-0 disabled:opacity-40"
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={startCreate}
            className="w-full flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> {t('expenses.newTemplate')}
          </Button>
        </div>
      )}
    </Modal>
  );
}
