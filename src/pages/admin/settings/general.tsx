import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { MSG } from '../../../constants/messages';
import * as adminService from '../../../services/admin.service';
import { formatApiError } from '../../../services/api';

export default function SettingsGeneralPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    app_name: '',
    app_description: '',
    allow_self_registration: 'false',
    must_change_password_on_create: 'true',
    login_history_retention_days: '90',
    max_upload_size_mb: '5',
    allowed_file_types: 'image/jpeg,image/png,image/webp,application/pdf',
    pix_key: '',
    pix_key_type: 'cpf',
    pix_holder_name: '',
    whatsapp_number: '',
    whatsapp_message_template: '',
    embedding_cost_mode: 'platform',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const PIX_KEY_TYPES = [
    { value: 'cpf', label: t('admin.pixKeyTypeCpf') },
    { value: 'cnpj', label: t('admin.pixKeyTypeCnpj') },
    { value: 'email', label: t('admin.pixKeyTypeEmail') },
    { value: 'phone', label: t('admin.pixKeyTypePhone') },
    { value: 'random', label: t('admin.pixKeyTypeRandom') },
  ];

  async function loadSettings() {
    try {
      const settings = await adminService.listSettings();
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(prev).filter((k) => k in map).map((k) => [k, map[k]]),
        ),
      }));
    } catch { setError(MSG.LOAD_SETTINGS_ERROR()); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminService.updateSettings(
        Object.entries(form).map(([key, value]) => ({ key, value })),
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="max-w-xl space-y-8">
      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.generalSection')}</h3>
          <Input label={t('admin.appName')} value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} placeholder={t('admin.appNamePlaceholder')} />
          <Input label={t('admin.appDescription')} value={form.app_description} onChange={(e) => setForm({ ...form, app_description: e.target.value })} placeholder={t('admin.appDescriptionPlaceholder')} />
        </div>

        {/* Registration & Security */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.registrationSecurity')}</h3>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.allowSelfRegistration')}</label>
            <select
              value={form.allow_self_registration}
              onChange={(e) => setForm({ ...form, allow_self_registration: e.target.value })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
            <p className="text-[10px] text-text-muted mt-1">{t('admin.selfRegistrationDesc')}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.forcePasswordChange')}</label>
            <select
              value={form.must_change_password_on_create}
              onChange={(e) => setForm({ ...form, must_change_password_on_create: e.target.value })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
          </div>
          <Input
            label={t('admin.loginHistoryRetention')}
            type="number"
            value={form.login_history_retention_days}
            onChange={(e) => setForm({ ...form, login_history_retention_days: e.target.value })}
            placeholder="90"
          />
        </div>

        {/* File Upload */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.fileUpload')}</h3>
          <Input
            label={t('admin.maxUploadSize')}
            type="number"
            value={form.max_upload_size_mb}
            onChange={(e) => setForm({ ...form, max_upload_size_mb: e.target.value })}
            placeholder="5"
          />
          <Input
            label={t('admin.allowedFileTypes')}
            value={form.allowed_file_types}
            onChange={(e) => setForm({ ...form, allowed_file_types: e.target.value })}
            placeholder="image/jpeg,image/png,application/pdf"
          />
          <p className="text-[10px] text-text-muted">{t('admin.allowedFileTypesDesc')}</p>
        </div>

        {/* PIX */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.pixData')}</h3>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.pixKeyType')}</label>
            <select
              value={form.pix_key_type}
              onChange={(e) => setForm({ ...form, pix_key_type: e.target.value })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              {PIX_KEY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>
          <Input label={t('admin.pixKey')} value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} placeholder={t('admin.pixKeyPlaceholder')} />
          <Input label={t('admin.pixHolderName')} value={form.pix_holder_name} onChange={(e) => setForm({ ...form, pix_holder_name: e.target.value })} />
        </div>

        {/* WhatsApp */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.whatsapp')}</h3>
          <Input label={t('admin.whatsappNumber')} value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="5511999999999" />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.whatsappTemplate')}</label>
            <textarea
              value={form.whatsapp_message_template}
              onChange={(e) => setForm({ ...form, whatsapp_message_template: e.target.value })}
              rows={3}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary resize-none"
              placeholder="Use {planName}, {tenantName}, {value}"
            />
            <p className="text-[10px] text-text-muted mt-1">{t('admin.whatsappVariables')}: {'{planName}'}, {'{tenantName}'}, {'{value}'}</p>
          </div>
        </div>

        {/* Embeddings */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('admin.embeddings')}</h3>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">{t('admin.embeddingCost')}</label>
            <select
              value={form.embedding_cost_mode}
              onChange={(e) => setForm({ ...form, embedding_cost_mode: e.target.value })}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
            >
              <option value="platform">{t('admin.embeddingPlatform')}</option>
              <option value="tenant">{t('admin.embeddingTenant')}</option>
            </select>
            <p className="text-[10px] text-text-muted mt-1">
              {form.embedding_cost_mode === 'platform'
                ? t('admin.embeddingPlatformDesc')
                : t('admin.embeddingTenantDesc')}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-success-muted border border-success/20 px-3 py-2">
            <p className="text-xs text-success">{t('admin.settingsSaved')}</p>
          </div>
        )}

        <Button type="submit" disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </form>
    </div>
  );
}
