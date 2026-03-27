import { useState, useEffect } from 'react';
import { Plus, Pencil, XCircle } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import * as categoryService from '../../services/expense-category.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ExpenseCategory } from '../../types/expense.types';

const emptyForm = {
  name: '',
  description: '',
  maxAmount: '',
  requiresReceipt: true,
  sortOrder: '0',
};

export default function ExpenseCategoriesPage() {
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
      setError('Erro ao carregar categorias de despesa');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await categoryService.createCategory({
        name: form.name,
        description: form.description || undefined,
        maxAmount: form.maxAmount || undefined,
        requiresReceipt: form.requiresReceipt,
        sortOrder: Number(form.sortOrder),
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
        maxAmount: form.maxAmount || undefined,
        requiresReceipt: form.requiresReceipt,
        sortOrder: Number(form.sortOrder),
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(category: ExpenseCategory) {
    if (!confirm(`Desativar "${category.name}"?`)) return;
    try {
      await categoryService.deactivateCategory(category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(category: ExpenseCategory) {
    setForm({
      name: category.name,
      description: category.description || '',
      maxAmount: category.maxAmount || '',
      requiresReceipt: category.requiresReceipt,
      sortOrder: String(category.sortOrder),
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

  function formatCurrency(value: string | null) {
    if (!value) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const formFields = (
    <>
      <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Input label="Teto (R$)" type="number" step="0.01" min="0" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="Ex: 100.00" />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresReceipt"
          checked={form.requiresReceipt}
          onChange={(e) => setForm({ ...form, requiresReceipt: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="requiresReceipt" className="text-sm text-text-primary">Exige Comprovante</label>
      </div>
      <Input label="Ordem" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
    </>
  );

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Categorias de Despesa</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> Nova Categoria</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Nome</TableHeader>
            <TableHeader>Descrição</TableHeader>
            <TableHeader>Teto</TableHeader>
            <TableHeader>Comprovante</TableHeader>
            <TableHeader>Ordem</TableHeader>
            <TableHeader>Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.description || '—'}</TableCell>
              <TableCell>{formatCurrency(c.maxAmount)}</TableCell>
              <TableCell>
                <Badge variant={c.requiresReceipt ? 'default' : 'success'}>{c.requiresReceipt ? 'Sim' : 'Não'}</Badge>
              </TableCell>
              <TableCell>{c.sortOrder}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title="Editar"><Pencil size={16} /></button>
                  <button onClick={() => handleDeactivate(c)} className="text-danger hover:text-danger/80" title="Desativar"><XCircle size={16} /></button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Categoria de Despesa">
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Categoria de Despesa">
        <form onSubmit={handleUpdate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
