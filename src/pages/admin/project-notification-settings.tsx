import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as settingsService from '../../services/project-notification-settings.service';
import type { NotificationSettingUser, NotificationEmail } from '../../services/project-notification-settings.service';

export default function ProjectNotificationSettingsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [users, setUsers] = useState<NotificationSettingUser[]>([]);
  const [emails, setEmails] = useState<NotificationEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, emailsRes] = await Promise.all([
        settingsService.getSettings(projectId!),
        settingsService.getEmails(projectId!),
      ]);
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

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title="Notifications">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-surface-2" />
          <div className="h-48 rounded-xl bg-surface-2" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} title={t('projects.notificationSettings')}>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <IconButton onClick={() => navigate(`/admin/projects/${projectId}`)} aria-label={t('common.back')}>
            <ArrowLeft size={18} />
          </IconButton>
          <h1 className="text-xl font-bold text-text-primary">{t('projects.notificationSettings')}</h1>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-text-primary">{t('projects.allocatedUsers')}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium">
                    {t('common.user') || 'Usuário'}
                  </th>
                  <th className="text-center py-2 text-text-muted font-medium w-24">
                    {t('projects.email')}
                  </th>
                  <th className="text-center py-2 text-text-muted font-medium w-24">
                    {t('projects.inApp')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <p className="text-text-primary font-medium">{u.userName}</p>
                      <p className="text-[11px] text-text-muted">{u.userEmail}</p>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={u.channelEmail}
                        onChange={() => handleToggle(u.userId, 'channelEmail')}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={u.channelInApp}
                        onChange={() => handleToggle(u.userId, 'channelInApp')}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-text-muted text-sm">
                      {t('common.noData') || 'Nenhum usuário alocado'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* External emails */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-text-primary">{t('projects.externalEmails')}</h3>

          {emails.length > 0 && (
            <div className="space-y-2">
              {emails.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <span className="text-sm text-text-primary">{e.email}</span>
                  <button
                    onClick={() => void handleRemoveEmail(e.id)}
                    className="text-text-muted hover:text-danger transition-colors"
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
      </div>
    </SidebarLayout>
  );
}
