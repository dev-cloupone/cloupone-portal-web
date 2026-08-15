import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as projectService from '../../services/project.service';
import * as settingsService from '../../services/project-notification-settings.service';
import type { NotificationSettingUser, NotificationEmail } from '../../services/project-notification-settings.service';

export default function ProjectNotificationSettingsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [projectName, setProjectName] = useState('');
  const [users, setUsers] = useState<NotificationSettingUser[]>([]);
  const [emails, setEmails] = useState<NotificationEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [project, settingsRes, emailsRes] = await Promise.all([
        projectService.getProject(projectId!),
        settingsService.getSettings(projectId!),
        settingsService.getEmails(projectId!),
      ]);
      setProjectName(project.name);
      setUsers(settingsRes.data);
      setEmails(emailsRes.data);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, addToast]);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId, loadData]);

  const ROLE_LABELS: Record<string, string> = {
    super_admin: t('admin.roleSuperAdmin'),
    administrative: t('admin.roleAdministrative'),
    gestor: t('admin.roleGestor'),
    consultor: t('admin.roleConsultor'),
    client: t('admin.roleClient'),
  };

  const EVENT_LABELS: Record<string, string> = {
    ticket_created: t('projects.ticketCreation'),
    all: t('projects.allEvents'),
  };

  const handleToggle = (userId: string, field: 'channelEmail' | 'channelInApp') => {
    setUsers(prev => prev.map(u =>
      u.userId === userId ? { ...u, [field]: !u[field] } : u,
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = users.map(u => ({
        userId: u.userId,
        eventType: u.eventType,
        channelEmail: u.channelEmail,
        channelInApp: u.channelInApp,
      }));
      await settingsService.upsertSettings(projectId!, settings);
      addToast(t('projects.settingsSaved'), 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const created = await settingsService.addEmail(projectId!, newEmail.trim());
      setEmails(prev => [...prev, created]);
      setNewEmail('');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  };

  const handleRemoveEmail = async (emailId: string) => {
    try {
      await settingsService.removeEmail(projectId!, emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  };

  return (
    <SidebarLayout navItems={navItems} title={t('projects.notificationSettings')}>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <IconButton onClick={() => navigate(`/admin/projects/${projectId}`)} aria-label={t('common.back')}>
            <ArrowLeft size={18} />
          </IconButton>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">{projectName || t('common.loading')}</h1>
            <p className="text-sm text-text-tertiary">{t('projects.notificationSettings')}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {/* Users table */}
            <section className="mb-6 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{t('projects.allocatedUsers')}</h3>
                <p className="text-xs text-text-tertiary">{t('projects.allocatedUsersDescription')}</p>
              </div>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('common.user')}</TableHeader>
                    <TableHeader>{t('common.role')}</TableHeader>
                    <TableHeader className="w-28">
                      <div className="text-center">
                        <span className="block text-[10px] text-text-tertiary normal-case">
                          {t('projects.ticketCreation')}
                        </span>
                        <span className="block">{t('projects.email')}</span>
                      </div>
                    </TableHeader>
                    <TableHeader className="w-28">
                      <div className="text-center">
                        <span className="block text-[10px] text-text-tertiary normal-case">
                          {t('projects.ticketCreation')}
                        </span>
                        <span className="block">{t('projects.inApp')}</span>
                      </div>
                    </TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell>
                        <p className="text-text-primary font-medium">{u.userName}</p>
                        <p className="text-[11px] text-text-muted">{u.userEmail}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.userRole === 'super_admin' ? 'warning' : 'default'}>
                          {ROLE_LABELS[u.userRole] ?? u.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`${t('projects.email')} - ${u.userName}`}
                          checked={u.channelEmail}
                          onChange={() => handleToggle(u.userId, 'channelEmail')}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`${t('projects.inApp')} - ${u.userName}`}
                          checked={u.channelInApp}
                          onChange={() => handleToggle(u.userId, 'channelInApp')}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-text-muted">
                        {t('projects.noAllocatedUsers')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </section>

            {/* External emails */}
            <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{t('projects.externalEmails')}</h3>
                <p className="text-xs text-text-tertiary">{t('projects.externalEmailsDescription')}</p>
              </div>

              {emails.length > 0 && (
                <div className="space-y-2">
                  {emails.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                      <div>
                        <span className="block text-sm text-text-primary">{e.email}</span>
                        <span className="block text-xs text-text-tertiary">
                          {EVENT_LABELS[e.eventType] ?? e.eventType}
                        </span>
                      </div>
                      <button
                        onClick={() => void handleRemoveEmail(e.id)}
                        className="text-text-muted hover:text-danger transition-colors"
                        title={t('common.remove')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddEmail} className="flex gap-2">
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  placeholder="email@example.com"
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" size="sm">
                  <Plus size={14} className="mr-1" />
                  {t('projects.addEmail')}
                </Button>
              </form>
            </div>

            {/* Save button */}
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? t('common.saving') : t('projects.saveChanges')}
            </Button>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
