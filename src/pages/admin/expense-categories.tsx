import { useState, useEffect } from 'react';
import { Plus, Pencil, XCircle, CheckCircle } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import * as categoryService from '../../services/expense-category.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import { useTranslation } from 'react-i18next';
import type { ExpenseCategory } from '../../types/expense.types';
import { formatCurrency } from '../../utils/formatters';

const emptyForm = {
  name: '',
  description: '',
  defaultMaxAmount: '',
  defaultKmRate: '',
  requiresReceipt: true,
  isKmCategory: false,
};

export default function ExpenseCategoriesPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    try {
      const result = await categoryService.listCategories();
      setCategories(result.data);
    } catch {
      setError(t('expenses.loadError'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await categoryService.createCategory({
        name: form.name,
        description: form.description || undefined,
        defaultMaxAmount: form.defaultMaxAmount || undefined,
        defaultKmRate: form.defaultKmRate || undefined,
        requiresReceipt: form.requiresReceipt,
        isKmCategory: form.isKmCategory,
      });
      setIsCreateOpen(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await categoryService.updateCategory(editing.id, {
        name: form.name,
        description: form.description || undefined,
        defaultMaxAmount: form.defaultMaxAmount || undefined,
        defaultKmRate: form.defaultKmRate || undefined,
        requiresReceipt: form.requiresReceipt,
        isKmCategory: form.isKmCategory,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(category: ExpenseCategory) {
    if (!confirm(t('common.confirmDeactivate', { name: category.name }))) return;
    try {
      await categoryService.deactivateCategory(category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleReactivate(category: ExpenseCategory) {
    if (!confirm(t('common.confirmReactivate', { name: category.name }))) return;
    try {
      await categoryService.reactivateCategory(category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(category: ExpenseCategory) {
    setForm({
      name: category.name,
      description: category.description || '',
      defaultMaxAmount: category.defaultMaxAmount || '',
      defaultKmRate: category.defaultKmRate || '',
      requiresReceipt: category.requiresReceipt,
      isKmCategory: category.isKmCategory,
    });
    setError('');
    setEditing(category);
  }

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setIsCreateOpen(true);
  }

  useEffect(() => { loadData(); }, []);

  function formatCurrencyOrDash(value: string | null) {
    if (!value) return '—';
    return formatCurrency(value);
  }

  const formFields = (
    <>
      <Input label={t('common.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Input label={t('common.ceilingDefault')} type="number" step="0.01" min="0" value={form.defaultMaxAmount} onChange={(e) => setForm({ ...form, defaultMaxAmount: e.target.value })} placeholder={t('expenses.ceilingPlaceholder')} />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isKmCategory"
          checked={form.isKmCategory}
          onChange={(e) => setForm({ ...form, isKmCategory: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="isKmCategory" className="text-sm text-text-primary">{t('expenses.kmCategory')}</label>
      </div>
      {form.isKmCategory && (
        <Input label={t('common.kmRateDefault')} type="number" step="0.01" min="0" value={form.defaultKmRate} onChange={(e) => setForm({ ...form, defaultKmRate: e.target.value })} placeholder={t('expenses.kmRatePlaceholder')} />
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresReceipt"
          checked={form.requiresReceipt}
          onChange={(e) => setForm({ ...form, requiresReceipt: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="requiresReceipt" className="text-sm text-text-primary">{t('expenses.requiresReceipt')}</label>
      </div>
    </>
  );

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('expenses.expenseCategories')}</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> {t('expenses.newCategory')}</Button>
      </div>

      {error && !isCreateOpen && !editing && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('common.name')}</TableHeader>
            <TableHeader>{t('common.description')}</TableHeader>
            <TableHeader>{t('expenses.defaultCeiling')}</TableHeader>
            <TableHeader>{t('expenses.km')}</TableHeader>
            <TableHeader>{t('expenses.requiresReceipt')}</TableHeader>
            <TableHeader>{t('common.status')}</TableHeader>
            <TableHeader>{t('common.actions')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.description || '—'}</TableCell>
              <TableCell>{formatCurrencyOrDash(c.defaultMaxAmount)}</TableCell>
              <TableCell>
                {c.isKmCategory ? (
                  <Badge variant="default">{c.defaultKmRate ? `R$ ${Number(c.defaultKmRate).toFixed(2)}${t('common.perKm')}` : t('common.yes')}</Badge>
                ) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={c.requiresReceipt ? 'default' : 'success'}>{c.requiresReceipt ? t('common.yes') : t('common.no')}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={c.isActive ? 'success' : 'danger'}>{c.isActive ? t('common.active') : t('common.inactive')}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {c.isActive ? (
                    <>
                      <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title={t('common.edit')}><Pencil size={16} /></button>
                      <button onClick={() => handleDeactivate(c)} className="text-danger hover:text-danger/80" title={t('common.deactivate')}><XCircle size={16} /></button>
                    </>
                  ) : (
                    <button onClick={() => handleReactivate(c)} className="text-accent hover:text-accent-hover" title={t('common.reactivate')}><CheckCircle size={16} /></button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setError(''); }} title={t('expenses.newCategoryModal')}>
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setError(''); }} title={t('expenses.editCategory')}>
        <form onSubmit={handleUpdate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
