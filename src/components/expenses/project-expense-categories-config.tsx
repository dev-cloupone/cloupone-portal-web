import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, XCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import * as projectCategoryService from '../../services/project-expense-category.service';
import * as categoryTemplateService from '../../services/expense-category.service';
import { formatApiError } from '../../services/api';
import type { ProjectExpenseCategory, ExpenseCategoryTemplate } from '../../types/expense.types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  projectId: string;
}

export function ProjectExpenseCategoriesConfig({ projectId }: Props) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ProjectExpenseCategory[]>([]);
  const [templates, setTemplates] = useState<ExpenseCategoryTemplate[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectExpenseCategory | null>(null);
  const [error, setError] = useState('');

  // Import form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [importMaxAmount, setImportMaxAmount] = useState('');
  const [importKmRate, setImportKmRate] = useState('');

  // Edit form state
  const [editMaxAmount, setEditMaxAmount] = useState('');
  const [editKmRate, setEditKmRate] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [catResult, tplResult] = await Promise.all([
        projectCategoryService.listByProject(projectId),
        categoryTemplateService.listCategories(),
      ]);
      setCategories(catResult.data);
      setTemplates(tplResult.data);
    } catch {
      setError(t('expenses.loadCategoriesError'));
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  function openImport() {
    setSelectedTemplateId('');
    setImportMaxAmount('');
    setImportKmRate('');
    setError('');
    setIsImportOpen(true);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setError('');
    try {
      await projectCategoryService.importFromTemplate(projectId, {
        templateId: selectedTemplateId,
        maxAmount: importMaxAmount || undefined,
        kmRate: importKmRate || undefined,
      });
      setIsImportOpen(false);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(category: ProjectExpenseCategory) {
    setEditMaxAmount(category.maxAmount || '');
    setEditKmRate(category.kmRate || '');
    setError('');
    setEditing(category);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await projectCategoryService.updateProjectCategory(projectId, editing.id, {
        maxAmount: editMaxAmount || null,
        kmRate: editKmRate || null,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(category: ProjectExpenseCategory) {
    if (!confirm(t('expenses.deactivateCategory', { name: category.name }))) return;
    try {
      await projectCategoryService.deactivateProjectCategory(projectId, category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function formatCurrencyOrDash(value: string | null) {
    if (!value) return '—';
    return formatCurrency(value);
  }

  // Filter templates not already imported (only check active categories)
  const availableTemplates = templates.filter(
    t => t.isActive && !categories.some(c => c.templateId === t.id && c.isActive),
  );

  const templateOptions = availableTemplates.map(t => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{t('expenses.projectCategoriesTitle')}</h3>
        <Button size="sm" onClick={openImport}>
          <Download size={14} className="mr-1.5" /> {t('expenses.importCategory')}
        </Button>
      </div>

      {error && !isImportOpen && !editing && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">
          {t('expenses.noCategoriesConfigured')}
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('expenses.tableName')}</TableHeader>
              <TableHeader>{t('expenses.tableCeiling')}</TableHeader>
              <TableHeader>{t('expenses.tableKm')}</TableHeader>
              <TableHeader>{t('expenses.tableReceiptRequired')}</TableHeader>
              <TableHeader>{t('expenses.tableActions')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{formatCurrencyOrDash(c.maxAmount)}</TableCell>
                <TableCell>
                  {c.isKmCategory ? (
                    <Badge variant="default">{c.kmRate ? `R$ ${Number(c.kmRate).toFixed(2)}/km` : 'Sim'}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={c.requiresReceipt ? 'default' : 'success'}>
                    {c.requiresReceipt ? t('expenses.yesLabel') : t('expenses.noLabel')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title={t('expenses.editLimits')}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeactivate(c)} className="text-danger hover:text-danger/80" title={t('expenses.deactivate')}>
                      <XCircle size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => { setIsImportOpen(false); setError(''); }} title={t('expenses.importCategoryTitle')}>
        <form onSubmit={handleImport} className="space-y-4">
          <Select
            label={t('expenses.templateSelectLabel')}
            options={templateOptions}
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            placeholder={t('expenses.selectTemplateOption')}
          />
          {selectedTemplate && (
            <div className="text-xs text-text-tertiary space-y-1 bg-surface-2 rounded-lg p-3">
              {selectedTemplate.description && <p>{selectedTemplate.description}</p>}
              <p>{t('expenses.defaultCeilingLabel', { amount: formatCurrencyOrDash(selectedTemplate.defaultMaxAmount) })}</p>
              {selectedTemplate.isKmCategory && (
                <p>{selectedTemplate.defaultKmRate ? t('expenses.defaultKmRateLabel', { rate: Number(selectedTemplate.defaultKmRate).toFixed(2) }) : '—'}</p>
              )}
              <p>{t('expenses.receiptRequiredYesNo', { value: selectedTemplate.requiresReceipt ? t('expenses.yesLabel') : t('expenses.noLabel') })}</p>
            </div>
          )}
          <Input
            label={t('expenses.ceilingForProject')}
            type="number"
            step="0.01"
            min="0"
            value={importMaxAmount}
            onChange={(e) => setImportMaxAmount(e.target.value)}
            placeholder={selectedTemplate?.defaultMaxAmount || t('expenses.noLimit')}
          />
          {selectedTemplate?.isKmCategory && (
            <Input
              label={t('expenses.kmRateForProject')}
              type="number"
              step="0.01"
              min="0"
              value={importKmRate}
              onChange={(e) => setImportKmRate(e.target.value)}
              placeholder={selectedTemplate?.defaultKmRate || t('expenses.noRate')}
            />
          )}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setIsImportOpen(false); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!selectedTemplateId}>{t('common.import')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setError(''); }} title={t('expenses.editCategoryTitle', { name: editing?.name })}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={t('expenses.ceilingInput')}
            type="number"
            step="0.01"
            min="0"
            value={editMaxAmount}
            onChange={(e) => setEditMaxAmount(e.target.value)}
            placeholder={t('expenses.noLimit')}
          />
          {editing?.isKmCategory && (
            <Input
              label={t('expenses.kmRateInput')}
              type="number"
              step="0.01"
              min="0"
              value={editKmRate}
              onChange={(e) => setEditKmRate(e.target.value)}
              placeholder={t('expenses.noRate')}
            />
          )}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setEditing(null); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
