import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { usePagination } from '../../hooks/use-pagination';
import * as consultantService from '../../services/consultant.service';
import * as adminService from '../../services/admin.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import type { Consultant } from '../../types/consultant.types';
import type { UserRecord } from '../../services/admin.service';

const contractTypeOptions = [
  { value: 'pj', label: 'PJ' },
  { value: 'clt', label: 'CLT' },
  { value: 'horista', label: 'Horista' },
];

export default function ConsultantsPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserRecord[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ userId: '', hourlyRate: '', contractType: 'pj', allowOverlappingEntries: false });
  const [editForm, setEditForm] = useState({ hourlyRate: '', contractType: 'pj', allowOverlappingEntries: false });
  const { page, limit, meta, setMeta, goToPage } = usePagination({ initialLimit: 20 });

  async function loadData() {
    try {
      const result = await consultantService.listConsultants({ page, limit });
      setConsultants(result.data);
      setMeta(result.meta);
    } catch {
      setError(t('admin.loadConsultantsError'));
    }
  }

  async function loadAvailableUsers() {
    try {
      const result = await adminService.listUsers({ limit: 100 });
      const consultantUserIds = new Set(consultants.map((c) => c.userId));
      setAvailableUsers(result.data.filter((u) => !consultantUserIds.has(u.id) && u.isActive));
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await consultantService.createConsultant({
        userId: createForm.userId,
        hourlyRate: Number(createForm.hourlyRate),
        contractType: createForm.contractType,
        allowOverlappingEntries: createForm.allowOverlappingEntries,
      });
      setIsCreateOpen(false);
      setCreateForm({ userId: '', hourlyRate: '', contractType: 'pj', allowOverlappingEntries: false });
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
      await consultantService.updateConsultant(editing.userId, {
        hourlyRate: Number(editForm.hourlyRate),
        contractType: editForm.contractType,
        allowOverlappingEntries: editForm.allowOverlappingEntries,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(consultant: Consultant) {
    setEditForm({
      hourlyRate: String(consultant.hourlyRate),
      contractType: consultant.contractType,
      allowOverlappingEntries: consultant.allowOverlappingEntries,
    });
    setError('');
    setEditing(consultant);
  }

  function openCreate() {
    setCreateForm({ userId: '', hourlyRate: '', contractType: 'pj', allowOverlappingEntries: false });
    setError('');
    loadAvailableUsers();
    setIsCreateOpen(true);
  }

  useEffect(() => { loadData(); }, [page, limit]);

  const contractLabel = (type: string) => {
    const map: Record<string, string> = { clt: 'CLT', pj: 'PJ', horista: 'Horista' };
    return map[type] || type;
  };

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('admin.consultants')}</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-2" /> {t('admin.newConsultant')}</Button>
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
            <TableHeader>{t('common.email')}</TableHeader>
            <TableHeader>{t('admin.ratePerHour')}</TableHeader>
            <TableHeader>{t('admin.contract')}</TableHeader>
            <TableHeader>{t('common.actions')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {consultants.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.userName}</TableCell>
              <TableCell>{c.userEmail}</TableCell>
              <TableCell>R$ {Number(c.hourlyRate).toFixed(2)}</TableCell>
              <TableCell><Badge variant="default">{contractLabel(c.contractType)}</Badge></TableCell>
              <TableCell>
                <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title={t('common.edit')}><Pencil size={16} /></button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}

      {/* Create */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setError(''); }} title={t('admin.newConsultant')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label={t('admin.user')}
            options={availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            value={createForm.userId}
            onChange={(v) => setCreateForm({ ...createForm, userId: v })}
            placeholder={t('admin.selectUser')}
            required
          />
          <Input label={t('admin.hourlyRate')} type="number" step="0.01" value={createForm.hourlyRate} onChange={(e) => setCreateForm({ ...createForm, hourlyRate: e.target.value })} required />
          <Select label={t('admin.contractType')} options={contractTypeOptions} value={createForm.contractType} onChange={(v) => setCreateForm({ ...createForm, contractType: v })} />
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.allowOverlappingEntries}
              onChange={(e) => setCreateForm({ ...createForm, allowOverlappingEntries: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
            />
            <div>
              <span className="text-sm text-text-primary">{t('admin.allowOverlapping')}</span>
              <p className="text-xs text-text-muted">{t('admin.allowOverlappingDesc')}</p>
            </div>
          </label>
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setIsCreateOpen(false); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setError(''); }} title={t('admin.editConsultant')}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t('admin.hourlyRate')} type="number" step="0.01" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} required />
          <Select label={t('admin.contractType')} options={contractTypeOptions} value={editForm.contractType} onChange={(v) => setEditForm({ ...editForm, contractType: v })} />
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.allowOverlappingEntries}
              onChange={(e) => setEditForm({ ...editForm, allowOverlappingEntries: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
            />
            <div>
              <span className="text-sm text-text-primary">{t('admin.allowOverlapping')}</span>
              <p className="text-xs text-text-muted">{t('admin.allowOverlappingDesc')}</p>
            </div>
          </label>
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setEditing(null); setError(''); }}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
