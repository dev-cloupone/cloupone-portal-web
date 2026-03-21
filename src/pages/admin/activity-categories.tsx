import { useState, useEffect } from 'react';
import { Plus, Pencil, XCircle } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import * as categoryService from '../../services/activity-category.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ActivityCategory } from '../../types/activity-category.types';

const emptyForm = { name: '', description: '', isBillable: true, sortOrder: '0' };

export default function ActivityCategoriesPage() {
  const navItems = useNavItems();
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityCategory | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    try {
      const result = await categoryService.listCategories();
      setCategories(result.data);
    } catch {
      setError('Erro ao carregar categorias');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await categoryService.createCategory({
        name: form.name,
        description: form.description || undefined,
        isBillable: form.isBillable,
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
        isBillable: form.isBillable,
        sortOrder: Number(form.sortOrder),
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(category: ActivityCategory) {
    if (!confirm(`Desativar ${category.name}?`)) return;
    try {
      await categoryService.deactivateCategory(category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(category: ActivityCategory) {
    setForm({
      name: category.name,
      description: category.description || '',
      isBillable: category.isBillable,
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

  const formFields = (
    <>
      <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isBillable"
          checked={form.isBillable}
          onChange={(e) => setForm({ ...form, isBillable: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="isBillable" className="text-sm text-text-primary">Faturável</label>
      </div>
      <Input label="Ordem" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
    </>
  );

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Categorias de Atividade</h2>
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
            <TableHeader>Faturável</TableHeader>
            <TableHeader>Ordem</TableHeader>
            <TableHeader>Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.description || '—'}</TableCell>
              <TableCell>
                <Badge variant={c.isBillable ? 'success' : 'default'}>{c.isBillable ? 'Sim' : 'Não'}</Badge>
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

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Categoria">
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Categoria">
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
