import { useState, useEffect, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileUpload } from '../components/ui/file-upload';
import { useAuth } from '../hooks/use-auth';
import { useNavItems } from '../hooks/use-nav-items';
import { api, formatApiError, BASE_URL } from '../services/api';
import * as uploadsService from '../services/uploads';
import * as loginHistoryService from '../services/login-history';
import { MSG } from '../constants/messages';
import type { LoginHistoryEntry } from '../types/login-history.types';

export default function ProfilePage() {
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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.avatarFileId ? `${BASE_URL}/uploads/download/${user.avatarFileId}` : undefined,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      setSuccess('Perfil atualizado com sucesso!');
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
      setError(MSG.PASSWORD_MIN_LENGTH);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(MSG.PASSWORDS_DONT_MATCH);
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
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setError('');
    try {
      const result = await uploadsService.uploadAvatar(file);
      setAvatarUrl(`${BASE_URL}${result.avatarUrl}`);
      if (result.user) setUser(result.user);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setError('');
    try {
      const result = await uploadsService.removeAvatar();
      setAvatarUrl(undefined);
      if (result.user) setUser(result.user);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const sidebarTitle = user?.role === 'super_admin' ? 'Admin' : 'Home';

  return (
    <SidebarLayout navItems={navItems} title={sidebarTitle}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Meu Perfil</h2>
        <p className="text-sm text-text-tertiary mt-1">Gerencie suas informacoes pessoais</p>
      </div>

      <div className="max-w-xl space-y-8">
        {/* Avatar */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Avatar</h3>
          <FileUpload
            accept="image/jpeg,image/png,image/webp"
            maxSize={5 * 1024 * 1024}
            onUpload={handleAvatarUpload}
            onError={setError}
            preview
            currentFileUrl={avatarUrl}
            onRemove={handleAvatarRemove}
            uploading={uploadingAvatar}
          />
        </div>

        {/* Profile Info */}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Informacoes Pessoais</h3>
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Alterar Senha</h3>
            <Input
              label="Senha Atual"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nova Senha"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              required
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Alterar Senha'}
          </Button>
        </form>

        {/* Login History */}
        {loginHistory.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Logins Recentes</h3>
            <div className="divide-y divide-border">
              {loginHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs text-text-primary">
                      {entry.success ? 'Login bem-sucedido' : 'Tentativa falhada'}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      IP: {entry.ipAddress || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${entry.success ? 'bg-success' : 'bg-danger'}`} />
                    <span className="text-[10px] text-text-muted">
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
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
