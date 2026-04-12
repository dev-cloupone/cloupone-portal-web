import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, XCircle, UserPlus, UserMinus, Layers } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { usePagination } from '../../hooks/use-pagination';
import * as projectService from '../../services/project.service';
import * as clientService from '../../services/client.service';
import * as consultantService from '../../services/consultant.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import { useAuth } from '../../hooks/use-auth';
import type { Project, ProjectAllocation } from '../../types/project.types';
import type { Client } from '../../types/client.types';
import type { Consultant } from '../../types/consultant.types';

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'finished', label: 'Finalizado' },
];

const budgetTypeOptions = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'total', label: 'Total' },
];

const emptyForm = { name: '', description: '', clientId: '', billingRate: '', budgetHours: '', budgetType: 'monthly', startDate: '', endDate: '' };

export default function ProjectsPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [consultantsList, setConsultantsList] = useState<Consultant[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editStatus, setEditStatus] = useState('active');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { page, limit, meta, setMeta, goToPage } = usePagination({ initialLimit: 20 });

  // Allocations state
  const [allocProject, setAllocProject] = useState<Project | null>(null);
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [allocUserId, setAllocUserId] = useState('');

  async function loadData() {
    try {
      const [result, clientsResult] = await Promise.all([
        projectService.listProjects({ page, limit, clientId: filterClient || undefined, status: filterStatus || undefined }),
        clientService.listClients({ limit: 100 }),
      ]);
      setProjects(result.data);
      setMeta(result.meta);
      setClientsList(clientsResult.data);
    } catch {
      setError('Erro ao carregar projetos');
    }
  }

  async function loadConsultants() {
    try {
      const result = await consultantService.listConsultants({ limit: 100 });
      setConsultantsList(result.data);
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await projectService.createProject({
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId,
        billingRate: Number(form.billingRate),
        budgetHours: form.budgetHours ? Number(form.budgetHours) : undefined,
        budgetType: form.budgetType || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
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
      await projectService.updateProject(editing.id, {
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId,
        status: editStatus,
        billingRate: Number(form.billingRate),
        budgetHours: form.budgetHours ? Number(form.budgetHours) : undefined,
        budgetType: form.budgetType || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(project: Project) {
    if (!confirm(`Desativar ${project.name}?`)) return;
    try {
      await projectService.deactivateProject(project.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(project: Project) {
    setForm({
      name: project.name,
      description: project.description || '',
      clientId: project.clientId,
      billingRate: String(project.billingRate),
      budgetHours: project.budgetHours ? String(project.budgetHours) : '',
      budgetType: project.budgetType || 'monthly',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setEditStatus(project.status);
    setError('');
    setEditing(project);
  }

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setIsCreateOpen(true);
  }

  async function openAllocations(project: Project) {
    setAllocProject(project);
    setAllocUserId('');
    try {
      const result = await projectService.listAllocations(project.id);
      setAllocations(result.data);
      await loadConsultants();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleAddAllocation() {
    if (!allocProject || !allocUserId) return;
    try {
      await projectService.addAllocation(allocProject.id, allocUserId);
      const result = await projectService.listAllocations(allocProject.id);
      setAllocations(result.data);
      setAllocUserId('');
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleRemoveAllocation(userId: string) {
    if (!allocProject) return;
    try {
      await projectService.removeAllocation(allocProject.id, userId);
      const result = await projectService.listAllocations(allocProject.id);
      setAllocations(result.data);
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  useEffect(() => { loadData(); }, [page, limit, filterClient, filterStatus]);

  const clientOptions = clientsList.map((c) => ({ value: c.id, label: c.companyName }));
  const allocatedUserIds = new Set(allocations.map((a) => a.userId));
  const availableConsultants = consultantsList.filter((c) => !allocatedUserIds.has(c.userId));

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'default'> = { active: 'success', paused: 'warning', finished: 'default' };
    const labels: Record<string, string> = { active: 'Ativo', paused: 'Pausado', finished: 'Finalizado' };
    return <Badge variant={map[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const formFields = (
    <>
      <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Select label="Cliente" options={clientOptions} value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} placeholder="Selecione um cliente" required />
      {isSuperAdmin && <Input label="Taxa/Hora (R$)" type="number" step="0.01" value={form.billingRate} onChange={(e) => setForm({ ...form, billingRate: e.target.value })} required />}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Horas Orçamento" type="number" value={form.budgetHours} onChange={(e) => setForm({ ...form, budgetHours: e.target.value })} />
        <Select label="Tipo Orçamento" options={budgetTypeOptions} value={form.budgetType} onChange={(v) => setForm({ ...form, budgetType: v })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Data Início" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input label="Data Fim" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      </div>
    </>
  );

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Projetos</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> Novo Projeto</Button>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <Select options={[{ value: '', label: 'Todos os clientes' }, ...clientOptions]} value={filterClient} onChange={setFilterClient} />
        </div>
        <div className="w-40">
          <Select options={[{ value: '', label: 'Todos os status' }, ...statusOptions]} value={filterStatus} onChange={setFilterStatus} />
        </div>
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
            <TableHeader>Cliente</TableHeader>
            <TableHeader>Status</TableHeader>
            {isSuperAdmin && <TableHeader>Taxa/h</TableHeader>}
            <TableHeader>Orçamento</TableHeader>
            <TableHeader>Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.clientName || '—'}</TableCell>
              <TableCell>{statusBadge(p.status)}</TableCell>
              {isSuperAdmin && <TableCell>R$ {Number(p.billingRate).toFixed(2)}</TableCell>}
              <TableCell>{p.budgetHours ? `${p.budgetHours}h (${p.budgetType === 'monthly' ? 'mensal' : 'total'})` : '—'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-accent hover:text-accent-hover" title="Editar"><Pencil size={16} /></button>
                  <button onClick={() => navigate(`/admin/projects/${p.id}/phases`)} className="text-accent hover:text-accent-hover" title="Fases"><Layers size={16} /></button>
                  <button onClick={() => openAllocations(p)} className="text-accent hover:text-accent-hover" title="Equipe"><UserPlus size={16} /></button>
                  {p.isActive && (
                    <button onClick={() => handleDeactivate(p)} className="text-danger hover:text-danger/80" title="Desativar"><XCircle size={16} /></button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Projeto">
        <form onSubmit={handleCreate} className="space-y-4">
          {formFields}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Projeto">
        <form onSubmit={handleUpdate} className="space-y-4">
          {formFields}
          <Select label="Status" options={statusOptions} value={editStatus} onChange={setEditStatus} />
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Allocations Modal */}
      <Modal isOpen={!!allocProject} onClose={() => setAllocProject(null)} title={`Equipe — ${allocProject?.name || ''}`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                options={availableConsultants.map((c) => ({ value: c.userId, label: `${c.userName} (${c.userEmail})` }))}
                value={allocUserId}
                onChange={setAllocUserId}
                placeholder="Selecione um membro"
              />
            </div>
            <Button onClick={handleAddAllocation} disabled={!allocUserId}><UserPlus size={16} /></Button>
          </div>
          {allocations.length > 0 ? (
            <div className="space-y-2">
              {allocations.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.userName}</p>
                    <p className="text-xs text-text-muted">{a.userEmail}</p>
                  </div>
                  <button onClick={() => handleRemoveAllocation(a.userId)} className="text-danger hover:text-danger/80" title="Remover">
                    <UserMinus size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Nenhum membro alocado.</p>
          )}
        </div>
      </Modal>
    </SidebarLayout>
  );
}
