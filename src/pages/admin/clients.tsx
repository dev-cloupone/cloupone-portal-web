import { useState, useEffect } from 'react';
import { Plus, Pencil, XCircle } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { usePagination } from '../../hooks/use-pagination';
import * as clientService from '../../services/client.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import type { Client } from '../../types/client.types';

const emptyForm = { companyName: '', cnpj: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' };

export default function ClientsPage() {
  const navItems = useNavItems();
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const { page, limit, meta, setMeta, goToPage } = usePagination({ initialLimit: 20 });

  async function loadData() {
    try {
      const result = await clientService.listClients({ page, limit, search: search || undefined });
      setClients(result.data);
      setMeta(result.meta);
    } catch {
      setError('Erro ao carregar clientes');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await clientService.createClient(form);
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
      await clientService.updateClient(editing.id, form);
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(client: Client) {
    if (!confirm(`Desativar ${client.companyName}?`)) return;
    try {
      await clientService.deactivateClient(client.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(client: Client) {
    setForm({
      companyName: client.companyName,
      cnpj: client.cnpj || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      notes: client.notes || '',
    });
    setError('');
    setEditing(client);
  }

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setIsCreateOpen(true);
  }

  useEffect(() => { loadData(); }, [page, limit, search]);

  const formFields = (
    <>
      <Input label="Razão Social" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
      <Input label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="XX.XXX.XXX/XXXX-XX" />
      <Input label="Nome do Contato" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
      <Input label="Email do Contato" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      <Input label="Telefone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
        />
      </div>
    </>
  );

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Clientes</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> Novo Cliente</Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Razão Social</TableHeader>
            <TableHeader>CNPJ</TableHeader>
            <TableHeader>Contato</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.companyName}</TableCell>
              <TableCell>{c.cnpj || '—'}</TableCell>
              <TableCell>{c.contactName || '—'}</TableCell>
              <TableCell>{c.contactEmail || '—'}</TableCell>
              <TableCell>
                <Badge variant={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'Ativo' : 'Inativo'}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title="Editar"><Pencil size={16} /></button>
                  {c.isActive && (
                    <button onClick={() => handleDeactivate(c)} className="text-danger hover:text-danger/80" title="Desativar"><XCircle size={16} /></button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Cliente">
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
