import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MSG } from '../../constants/messages';
import * as adminService from '../../services/admin.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatoria' },
];

export default function SettingsPage() {
  const navItems = useNavItems();
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
    } catch { setError(MSG.LOAD_SETTINGS_ERROR); }
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
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Configurações da Plataforma</h2>
        <p className="text-sm text-text-tertiary mt-1">Gerencie as configuracoes gerais do sistema</p>
      </div>

      <div className="max-w-xl space-y-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* General */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Geral</h3>
            <Input label="Nome do App" value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} placeholder="Nome da aplicacao" />
            <Input label="Descrição" value={form.app_description} onChange={(e) => setForm({ ...form, app_description: e.target.value })} placeholder="Descrição breve" />
          </div>

          {/* Registration & Security */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Registro e Seguranca</h3>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Permitir auto-registro</label>
              <select
                value={form.allow_self_registration}
                onChange={(e) => setForm({ ...form, allow_self_registration: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="true">Sim</option>
                <option value="false">Nao</option>
              </select>
              <p className="text-[10px] text-text-muted mt-1">Permite que novos usuarios se registrem pela pagina de login.</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Forcar troca de senha ao criar usuario</label>
              <select
                value={form.must_change_password_on_create}
                onChange={(e) => setForm({ ...form, must_change_password_on_create: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="true">Sim</option>
                <option value="false">Nao</option>
              </select>
            </div>
            <Input
              label="Retencao de historico de login (dias)"
              type="number"
              value={form.login_history_retention_days}
              onChange={(e) => setForm({ ...form, login_history_retention_days: e.target.value })}
              placeholder="90"
            />
          </div>

          {/* File Upload */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Upload de Arquivos</h3>
            <Input
              label="Tamanho maximo (MB)"
              type="number"
              value={form.max_upload_size_mb}
              onChange={(e) => setForm({ ...form, max_upload_size_mb: e.target.value })}
              placeholder="5"
            />
            <Input
              label="Tipos de arquivo permitidos"
              value={form.allowed_file_types}
              onChange={(e) => setForm({ ...form, allowed_file_types: e.target.value })}
              placeholder="image/jpeg,image/png,application/pdf"
            />
            <p className="text-[10px] text-text-muted">Separados por virgula (MIME types).</p>
          </div>

          {/* PIX */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Dados do Pix</h3>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Tipo de chave</label>
              <select
                value={form.pix_key_type}
                onChange={(e) => setForm({ ...form, pix_key_type: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <Input label="Chave Pix" value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} placeholder="Ex: 000.000.000-00" />
            <Input label="Nome do titular" value={form.pix_holder_name} onChange={(e) => setForm({ ...form, pix_holder_name: e.target.value })} />
          </div>

          {/* WhatsApp */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">WhatsApp</h3>
            <Input label="Numero" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="5511999999999" />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Mensagem modelo</label>
              <textarea
                value={form.whatsapp_message_template}
                onChange={(e) => setForm({ ...form, whatsapp_message_template: e.target.value })}
                rows={3}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary resize-none"
                placeholder="Use {planName}, {tenantName}, {value}"
              />
              <p className="text-[10px] text-text-muted mt-1">Variaveis: {'{planName}'}, {'{tenantName}'}, {'{value}'}</p>
            </div>
          </div>

          {/* Embeddings */}
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Embeddings (RAG)</h3>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1 block">Custo de Embeddings</label>
              <select
                value={form.embedding_cost_mode}
                onChange={(e) => setForm({ ...form, embedding_cost_mode: e.target.value })}
                className="block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="platform">Plataforma absorve</option>
                <option value="tenant">Cobrar do tenant</option>
              </select>
              <p className="text-[10px] text-text-muted mt-1">
                {form.embedding_cost_mode === 'platform'
                  ? 'A plataforma usa sua propria chave OpenAI para gerar embeddings.'
                  : 'Cada tenant usa sua propria chave OpenAI para gerar embeddings.'}
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
              <p className="text-xs text-success">Configurações salvas com sucesso!</p>
            </div>
          )}

          <Button type="submit" disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </div>
    </SidebarLayout>
  );
}
