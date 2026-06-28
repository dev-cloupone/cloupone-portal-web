import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
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
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import { useAuth } from '../../hooks/use-auth';
import type { Project } from '../../types/project.types';
import type { Client } from '../../types/client.types';
import { useTranslation } from 'react-i18next';
import { getStatusOptions, getBudgetTypeOptions, STATUS_VARIANTS, STATUS_LABELS, BUDGET_TYPE_LABELS, BILLING_TYPE_LABELS, BILLING_TYPE_VARIANTS, getBillingTypeOptions } from '../../constants/project.constants';

const emptyForm = { name: '', description: '', clientId: '', billingType: 'hourly', billingRate: '', fixedPriceTotal: '', budgetHours: '', budgetType: 'monthly', startDate: '', endDate: '' };

export default function ProjectsPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { page, limit, meta, setMeta, goToPage } = usePagination({ initialLimit: 20 });

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
      setError(t('projects.loadError'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await projectService.createProject({
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId,
        billingType: form.billingType || 'hourly',
        billingRate: (form.billingType !== 'fixed_price' && form.billingRate) ? Number(form.billingRate) : undefined,
        ...(form.billingType === 'fixed_price' && { fixedPriceTotal: Number(form.fixedPriceTotal) }),
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

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setIsCreateOpen(true);
  }

  useEffect(() => { loadData(); }, [page, limit, filterClient, filterStatus]);

  const clientOptions = clientsList.map((c) => ({ value: c.id, label: c.companyName }));

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('projects.title')}</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> {t('projects.newProject')}</Button>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <Select options={[{ value: '', label: t('common.allClients') }, ...clientOptions]} value={filterClient} onChange={setFilterClient} />
        </div>
        <div className="w-40">
          <Select options={[{ value: '', label: t('common.allStatuses') }, ...getStatusOptions().map(o => ({ ...o, label: t(o.label) }))]} value={filterStatus} onChange={setFilterStatus} />
        </div>
      </div>

      {error && !isCreateOpen && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('common.name')}</TableHeader>
            <TableHeader>{t('projects.client')}</TableHeader>
            <TableHeader>{t('common.type')}</TableHeader>
            <TableHeader>{t('common.status')}</TableHeader>
            <TableHeader>{t('projects.budgetHours')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => (
            <TableRow
              key={p.id}
              onClick={() => navigate(`/admin/projects/${p.id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.clientName || '—'}</TableCell>
              <TableCell><Badge variant={BILLING_TYPE_VARIANTS[p.billingType] || 'default'}>{t(BILLING_TYPE_LABELS[p.billingType] || 'projects.billingHourly')}</Badge></TableCell>
              <TableCell><Badge variant={STATUS_VARIANTS[p.status] || 'default'}>{t(STATUS_LABELS[p.status] || 'projects.statusActive')}</Badge></TableCell>
              <TableCell>{p.budgetHours ? `${p.budgetHours}h (${t(BUDGET_TYPE_LABELS[p.budgetType || 'total'] || 'projects.budgetTotalLower')})` : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setError(''); }} title={t('projects.newProject')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label={t('common.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label={t('projects.client')} options={clientOptions} value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v })} placeholder={t('common.selectClient')} required />
          {isSuperAdmin && (
            <>
              <Select label={t('projects.billingType')} options={getBillingTypeOptions().map(o => ({ ...o, label: t(o.label) }))} value={form.billingType} onChange={(v) => setForm({ ...form, billingType: v })} />
              {form.billingType === 'hourly' ? (
                <Input label={t('projects.billingRateClient')} type="number" step="0.01" value={form.billingRate} onChange={(e) => setForm({ ...form, billingRate: e.target.value })} required />
              ) : (
                <Input label={t('projects.fixedPriceTotal')} type="number" step="0.01" value={form.fixedPriceTotal} onChange={(e) => setForm({ ...form, fixedPriceTotal: e.target.value })} required />
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('projects.budgetHours')} type="number" value={form.budgetHours} onChange={(e) => setForm({ ...form, budgetHours: e.target.value })} />
            <Select label={t('projects.budgetType')} options={getBudgetTypeOptions().map(o => ({ ...o, label: t(o.label) }))} value={form.budgetType} onChange={(v) => setForm({ ...form, budgetType: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('projects.startDate')} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label={t('projects.endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setIsCreateOpen(false); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
