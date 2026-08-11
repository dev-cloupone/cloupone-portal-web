import { useState, useEffect } from 'react';
import { Plus, Pencil, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MSG } from '../../constants/messages';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { usePagination } from '../../hooks/use-pagination';
import * as adminService from '../../services/admin.service';
import * as clientService from '../../services/client.service';
import { formatApiError } from '../../services/api';
import type { UserRecord } from '../../services/admin.service';
import type { Client } from '../../types/client.types';
import { useNavItems } from '../../hooks/use-nav-items';
import { useLocaleStore } from '../../stores/locale.store';

export default function UsersPage() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const navItems = useNavItems();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'client', clientId: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'client', clientId: '' });
  const [filterRole, setFilterRole] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('true');
  const { page, limit, meta, setMeta, goToPage, resetPage } = usePagination({ initialLimit: 20 });

  function handleFilterRole(value: string) { setFilterRole(value); resetPage(); }
  function handleFilterClient(value: string) { setFilterClient(value); resetPage(); }
  function handleFilterStatus(value: string) { setFilterStatus(value); resetPage(); }

  useEffect(() => {
    clientService.listClients({ limit: 100 }).then((res) => setClients(res.data)).catch(console.error);
  }, []);

  async function loadData() {
    try {
      const result = await adminService.listUsers({
        page,
        limit,
        role: filterRole || undefined,
        clientId: filterClient || undefined,
        isActive: filterStatus || undefined,
      });
      setUsers(result.data);
      setMeta(result.meta);
    } catch {
      setError(MSG.LOAD_USERS_ERROR());
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (createForm.role === 'client' && !createForm.clientId) {
      setError(t('admin.selectClient'));
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
      setError(t('admin.selectClient'));
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

  async function handleResendWelcome(user: UserRecord) {
    if (!confirm(`Isso irá gerar uma nova senha para ${user.name} e enviá-la por e-mail. A senha atual será substituída. Deseja continuar?`)) return;
    try {
      await adminService.resendWelcomeEmail(user.id);
      setError('');
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleSendPasswordReset(user: UserRecord) {
    if (!confirm(`Enviar link de redefinição de senha para ${user.name}?`)) return;
    try {
      await adminService.sendPasswordResetEmail(user.id);
      setError('');
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(user: UserRecord) {
    if (!confirm(t('admin.confirmDeactivateUser', { name: user.name }))) return;
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

  useEffect(() => { loadData(); }, [page, limit, filterRole, filterClient, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientMap = new Map(clients.map((c) => [c.id, c.companyName]));

  const ROLE_LABELS: Record<string, string> = {
    super_admin: t('admin.roleSuperAdmin'),
    administrative: t('admin.roleAdministrative'),
    gestor: t('admin.roleGestor'),
    consultor: t('admin.roleConsultor'),
    client: t('admin.roleClient'),
  };

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('admin.users')}</h2>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> {t('admin.newUser')}
        </Button>
      </div>

      {error && !isCreateModalOpen && !editingUser && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="w-44">
          <Select
            label={t('common.role')}
            options={[
              { value: '', label: t('common.allFeminine') },
              { value: 'super_admin', label: t('admin.roleSuperAdmin') },
              { value: 'administrative', label: t('admin.roleAdministrative') },
              { value: 'gestor', label: t('admin.roleGestor') },
              { value: 'consultor', label: t('admin.roleConsultor') },
              { value: 'client', label: t('admin.roleClient') },
            ]}
            value={filterRole}
            onChange={handleFilterRole}
          />
        </div>
        <div className="w-52">
          <Select
            label={t('admin.roleClient')}
            options={[{ value: '', label: t('common.all') }, ...clients.map((c) => ({ value: c.id, label: c.companyName }))]}
            value={filterClient}
            onChange={handleFilterClient}
          />
        </div>
        <div className="w-36">
          <Select
            label={t('common.status')}
            options={[
              { value: '', label: t('common.all') },
              { value: 'true', label: t('common.active') },
              { value: 'false', label: t('common.inactive') },
            ]}
            value={filterStatus}
            onChange={handleFilterStatus}
          />
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('common.name')}</TableHeader>
            <TableHeader>{t('common.email')}</TableHeader>
            <TableHeader>{t('common.role')}</TableHeader>
            <TableHeader>{t('admin.roleClient')}</TableHeader>
            <TableHeader>{t('common.status')}</TableHeader>
            <TableHeader>{t('common.createdAt')}</TableHeader>
            <TableHeader>{t('common.actions')}</TableHeader>
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
                  {u.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
              </TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleDateString(locale)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-accent hover:text-accent-hover" title={t('common.edit')}>
                    <Pencil size={16} />
                  </button>
                  {u.isActive && (
                    <button onClick={() => handleDeactivate(u)} className="text-danger hover:text-danger/80" title={t('common.deactivate')}>
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
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setError(''); }} title={t('admin.newUser')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('common.name')}
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder={t('common.fullName')}
            required
          />
          <Input
            label={t('common.email')}
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label={t('admin.password')}
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder={t('admin.minChars')}
            required
            minLength={8}
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('common.role')}</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value, clientId: '' })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="client">{t('admin.roleClient')}</option>
              <option value="consultor">{t('admin.roleConsultor')}</option>
              <option value="administrative">{t('admin.roleAdministrative')}</option>
              <option value="gestor">{t('admin.roleGestor')}</option>
              <option value="super_admin">{t('admin.roleSuperAdmin')}</option>
            </select>
          </div>
          {createForm.role === 'client' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.clientLabel')}</label>
              <select
                required
                value={createForm.clientId}
                onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">{t('common.selectClient')}</option>
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
            <Button variant="secondary" type="button" onClick={() => { setIsCreateModalOpen(false); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editingUser} onClose={() => { setEditingUser(null); setError(''); }} title={t('admin.editUser')}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={t('common.name')}
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label={t('common.email')}
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('common.role')}</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value, clientId: '' })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="client">{t('admin.roleClient')}</option>
              <option value="consultor">{t('admin.roleConsultor')}</option>
              <option value="administrative">{t('admin.roleAdministrative')}</option>
              <option value="gestor">{t('admin.roleGestor')}</option>
              <option value="super_admin">{t('admin.roleSuperAdmin')}</option>
            </select>
          </div>
          {editForm.role === 'client' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.clientLabel')}</label>
              <select
                required
                value={editForm.clientId}
                onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">{t('common.selectClient')}</option>
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
            {editingUser?.isActive && (
              <div className="flex gap-2 mr-auto">
                <Button variant="secondary" type="button" onClick={() => handleResendWelcome(editingUser)}>
                  Reenviar boas-vindas
                </Button>
                <Button variant="secondary" type="button" onClick={() => handleSendPasswordReset(editingUser)}>
                  Enviar reset de senha
                </Button>
              </div>
            )}
            <Button variant="secondary" type="button" onClick={() => { setEditingUser(null); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
