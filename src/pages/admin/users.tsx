import { useState, useEffect } from 'react';
import { Plus, Pencil, UserX } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MSG } from '../../constants/messages';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { usePagination } from '../../hooks/use-pagination';
import * as adminService from '../../services/admin.service';
import * as clientService from '../../services/client.service';
import { formatApiError } from '../../services/api';
import type { UserRecord } from '../../services/admin.service';
import type { Client } from '../../types/client.types';
import { useNavItems } from '../../hooks/use-nav-items';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  gestor: 'Gestor',
  consultor: 'Consultor',
  client: 'Cliente',
};

export default function UsersPage() {
  const navItems = useNavItems();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'client', clientId: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'client', clientId: '' });
  const { page, limit, meta, setMeta, goToPage } = usePagination({ initialLimit: 20 });

  useEffect(() => {
    clientService.listClients({ limit: 100 }).then((res) => setClients(res.data)).catch(console.error);
  }, []);

  async function loadData() {
    try {
      const result = await adminService.listUsers({ page, limit });
      setUsers(result.data);
      setMeta({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch {
      setError(MSG.LOAD_USERS_ERROR);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (createForm.role === 'client' && !createForm.clientId) {
      setError('Selecione um cliente.');
      return;
    }
    try {
      await adminService.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        clientId: createForm.role === 'client' && createForm.clientId ? createForm.clientId : null,
      });
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'client', clientId: '' });
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    if (editForm.role === 'client' && !editForm.clientId) {
      setError('Selecione um cliente.');
      return;
    }
    try {
      await adminService.updateUser(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        clientId: editForm.role === 'client' && editForm.clientId ? editForm.clientId : null,
      });
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(user: UserRecord) {
    if (!confirm(`Desativar ${user.name}?`)) return;
    try {
      await adminService.deactivateUser(user.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(user: UserRecord) {
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId || '',
    });
    setError('');
    setEditingUser(user);
  }

  function openCreate() {
    setCreateForm({ name: '', email: '', password: '', role: 'client', clientId: '' });
    setError('');
    setIsCreateModalOpen(true);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [page, limit]);

  const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Usuarios</h2>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Novo Usuario
        </Button>
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
            <TableHeader>Email</TableHeader>
            <TableHeader>Role</TableHeader>
            <TableHeader>Cliente</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Criado em</TableHeader>
            <TableHeader>Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.role === 'super_admin' ? 'warning' : 'default'}>
                  {ROLE_LABELS[u.role] || u.role}
                </Badge>
              </TableCell>
              <TableCell>
                {u.clientId ? (
                  <span className="text-sm text-text-secondary">{clientMap.get(u.clientId) || '—'}</span>
                ) : (
                  <span className="text-sm text-text-muted">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={u.isActive ? 'success' : 'danger'}>
                  {u.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-accent hover:text-accent-hover" title="Editar">
                    <Pencil size={16} />
                  </button>
                  {u.isActive && (
                    <button onClick={() => handleDeactivate(u)} className="text-danger hover:text-danger/80" title="Desativar">
                      <UserX size={16} />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}

      {/* Create User Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Nome completo"
            required
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Minimo 8 caracteres"
            required
            minLength={8}
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value, clientId: '' })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="client">Cliente</option>
              <option value="consultor">Consultor</option>
              <option value="gestor">Gestor</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {createForm.role === 'client' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Cliente *</label>
              <select
                required
                value={createForm.clientId}
                onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger whitespace-pre-line">{error}</p>
            </div>
          )}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Editar Usuario">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Nome"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value, clientId: '' })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="client">Cliente</option>
              <option value="consultor">Consultor</option>
              <option value="gestor">Gestor</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {editForm.role === 'client' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Cliente *</label>
              <select
                required
                value={editForm.clientId}
                onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger whitespace-pre-line">{error}</p>
            </div>
          )}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
