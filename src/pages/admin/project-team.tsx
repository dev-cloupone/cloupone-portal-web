import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, UserPlus, UserMinus } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { useNavItems } from '../../hooks/use-nav-items';
import { useAuth } from '../../hooks/use-auth';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as projectService from '../../services/project.service';
import * as consultantService from '../../services/consultant.service';
import type { ProjectAllocation } from '../../types/project.types';
import type { Consultant } from '../../types/consultant.types';
import { useTranslation } from 'react-i18next';

interface AllocationRow extends ProjectAllocation {
  editCostRate: string;
  editBillingRate: string;
}

export default function ProjectTeamPage() {
  const { t } = useTranslation();
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const { user } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const isSuperAdmin = user?.role === 'super_admin';

  const [projectName, setProjectName] = useState('');
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [consultantsList, setConsultantsList] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [savingUser, setSavingUser] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const [project, allocResult, consultantsResult] = await Promise.all([
        projectService.getProject(projectId),
        projectService.listAllocations(projectId),
        consultantService.listConsultants({ limit: 100 }),
      ]);
      setProjectName(project.name);
      setRows(allocResult.data.map((a) => ({
        ...a,
        editCostRate: a.costRate ?? '0.00',
        editBillingRate: a.billingRate ?? '0.00',
      })));
      setConsultantsList(consultantsResult.data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const allocatedUserIds = new Set(rows.map((r) => r.userId));
  const availableConsultants = consultantsList.filter((c) => !allocatedUserIds.has(c.userId));

  async function handleAdd() {
    if (!projectId || !addUserId) return;
    try {
      await projectService.addAllocation(projectId, addUserId);
      setAddUserId('');
      await loadData();
      addToast(t('projects.consultantAllocated'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleRemove(userId: string, userName: string) {
    if (!projectId || !confirm(t('projects.removeFromProject', { name: userName }))) return;
    try {
      await projectService.removeAllocation(projectId, userId);
      await loadData();
      addToast(t('projects.removedFromProject', { name: userName }), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  function updateField(userId: string, field: 'editCostRate' | 'editBillingRate', value: string) {
    setRows((prev) => prev.map((r) => (r.userId === userId ? { ...r, [field]: value } : r)));
  }

  async function handleSaveRates(row: AllocationRow) {
    if (!projectId) return;
    setSavingUser(row.userId);
    try {
      await projectService.updateAllocationRates(projectId, row.userId, {
        costRate: row.editCostRate,
        billingRate: row.editBillingRate,
      });
      addToast(t('projects.ratesUpdated', { name: row.userName }), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setSavingUser(null);
    }
  }

  if (!projectId) return null;

  return (
    <SidebarLayout navItems={navItems} title={t('projects.team')}>
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate(`/admin/projects/${projectId}`)} aria-label={t('common.back')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{projectName || t('common.loading')}</h1>
          <p className="text-sm text-text-tertiary">{t('projects.teamManagement')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Add consultant */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 max-w-sm">
          <Select
            options={availableConsultants.map((c) => ({ value: c.userId, label: `${c.userName} (${c.userEmail})` }))}
            value={addUserId}
            onChange={setAddUserId}
            placeholder={t('projects.selectConsultant')}
          />
        </div>
        <Button onClick={handleAdd} disabled={!addUserId}>
          <UserPlus size={16} className="mr-2" /> {t('common.allocate')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <p className="text-text-muted text-sm">{t('projects.noConsultantsAllocated')}</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('common.consultant')}</TableHeader>
              <TableHeader>{t('common.email')}</TableHeader>
              {isSuperAdmin && <TableHeader>{t('projects.costRateConsultant')}</TableHeader>}
              {isSuperAdmin && <TableHeader>{t('projects.billingRateClientTeam')}</TableHeader>}
              <TableHeader>{t('common.actions')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell className="font-medium">{row.userName}</TableCell>
                <TableCell className="text-text-muted">{row.userEmail}</TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.editCostRate}
                      onChange={(e) => updateField(row.userId, 'editCostRate', e.target.value)}
                      className="w-28 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-sm font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  </TableCell>
                )}
                {isSuperAdmin && (
                  <TableCell>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.editBillingRate}
                      onChange={(e) => updateField(row.userId, 'editBillingRate', e.target.value)}
                      className="w-28 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-sm font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-2">
                    {isSuperAdmin && (
                      <Button
                        onClick={() => handleSaveRates(row)}
                        disabled={savingUser === row.userId}
                      >
                        <Save size={16} className="mr-1" />
                        {savingUser === row.userId ? t('common.saving') : t('common.save')}
                      </Button>
                    )}
                    <button
                      onClick={() => handleRemove(row.userId, row.userName)}
                      className="text-danger hover:text-danger/80"
                      title={t('common.remove')}
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SidebarLayout>
  );
}
