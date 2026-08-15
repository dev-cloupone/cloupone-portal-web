import { useState, useEffect, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/use-auth';
import { useNavItems } from '../hooks/use-nav-items';
import { api, formatApiError } from '../services/api';
import * as loginHistoryService from '../services/login-history';
import * as notificationService from '../services/notification.service';
import { MSG } from '../constants/messages';
import type { LoginHistoryEntry } from '../types/login-history.types';
import { useLocaleStore } from '../stores/locale.store';

export default function ProfilePage() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { user, setUser } = useAuth();
  const navItems = useNavItems();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);

  useEffect(() => {
    loginHistoryService.getMyLoginHistory()
      .then(setLoginHistory)
      .catch(() => {});
  }, []);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const result = await api<{ user: typeof user }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email }),
      });
      if (result.user) setUser(result.user);
      setSuccess(t('auth.profileUpdated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError(MSG.PASSWORD_MIN_LENGTH());
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(MSG.PASSWORDS_DONT_MATCH());
      return;
    }

    setSaving(true);
    try {
      await api('/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(t('auth.passwordChanged'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const sidebarTitle = user?.role === 'super_admin' ? 'Admin' : 'Home';

  return (
    <SidebarLayout navItems={navItems} title={sidebarTitle}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('auth.myProfile')}</h2>
        <p className="text-sm text-text-tertiary mt-1">{t('auth.managePersonalInfo')}</p>
      </div>

      <div className="max-w-xl space-y-8">
        {/* Profile Info */}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">{t('auth.personalInfo')}</h3>
            <Input
              label={t('auth.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? t('common.saving') : t('auth.saveProfile')}
          </Button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">{t('auth.changePassword')}</h3>
            <Input
              label={t('auth.currentPassword')}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label={t('auth.newPassword')}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('auth.minChars')}
              required
            />
            <Input
              label={t('auth.confirmNewPassword')}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.repeatNewPassword')}
              required
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? t('common.saving') : t('auth.changePassword')}
          </Button>
        </form>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('notifications.preferences')}</h3>

          <label className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm text-text-primary">{t('notifications.triageMode')}</p>
              <p className="text-[11px] text-text-muted">{t('notifications.triageModeDescription')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={user?.urgentNotificationsEnabled ?? false}
              onClick={async () => {
                const newVal = !(user?.urgentNotificationsEnabled ?? false);
                try {
                  await notificationService.updateNotificationPreferences({ urgentNotificationsEnabled: newVal });
                  setUser({ ...user!, urgentNotificationsEnabled: newVal });
                } catch (err) {
                  setError(formatApiError(err));
                }
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                user?.urgentNotificationsEnabled ? 'bg-accent' : 'bg-surface-3'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                user?.urgentNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm text-text-primary">{t('notifications.soundEnabled')}</p>
              <p className="text-[11px] text-text-muted">{t('notifications.soundEnabledDescription')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={user?.notificationSoundEnabled ?? false}
              onClick={async () => {
                const newVal = !(user?.notificationSoundEnabled ?? false);
                try {
                  await notificationService.updateNotificationPreferences({ notificationSoundEnabled: newVal });
                  setUser({ ...user!, notificationSoundEnabled: newVal });
                } catch (err) {
                  setError(formatApiError(err));
                }
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                user?.notificationSoundEnabled ? 'bg-accent' : 'bg-surface-3'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                user?.notificationSoundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </label>
        </div>

        {/* Login History */}
        {loginHistory.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">{t('auth.recentLogins')}</h3>
            <div className="divide-y divide-border">
              {loginHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs text-text-primary">
                      {entry.success ? t('auth.loginSuccessful') : t('auth.loginFailed')}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      IP: {entry.ipAddress || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${entry.success ? 'bg-success' : 'bg-danger'}`} />
                    <span className="text-[10px] text-text-muted">
                      {new Date(entry.createdAt).toLocaleString(locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-success-muted border border-success/20 px-3 py-2">
            <p className="text-xs text-success">{success}</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
