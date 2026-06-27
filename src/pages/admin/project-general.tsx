import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as projectService from '../../services/project.service';
import * as clientService from '../../services/client.service';
import { statusOptions } from '../../constants/project.constants';

export default function ProjectGeneralPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    clientId: '',
    budgetHours: '',
    startDate: '',
    endDate: '',
    status: 'active',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [project, clients] = await Promise.all([
        projectService.getProject(id!),
        clientService.listClients({ limit: 100 }),
      ]);
      setForm({
        name: project.name,
        description: project.description || '',
        clientId: project.clientId,
        budgetHours: String(project.budgetHours || ''),
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        status: project.status,
      });
      setClientOptions(
        clients.data.map((c) => ({ value: c.id, label: c.companyName }))
      );
    } catch {
      addToast('Erro ao carregar projeto', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await projectService.updateProject(id!, {
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId,
        budgetHours: form.budgetHours ? Number(form.budgetHours) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        status: form.status,
      });
      addToast('Projeto atualizado com sucesso', 'success');
      navigate(`/admin/projects/${id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title="Dados Gerais">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-2" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-2" />
            ))}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} title="Dados Gerais">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate(`/admin/projects/${id}`)} aria-label="Voltar">
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{form.name || 'Carregando...'}</h1>
          <p className="text-sm text-text-tertiary">Dados gerais do projeto</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Select
          label="Cliente"
          options={clientOptions}
          value={form.clientId}
          onChange={(v) => setForm({ ...form, clientId: v })}
          placeholder="Selecione um cliente"
          required
        />
        <Input
          label="Horas Orçamento"
          type="number"
          value={form.budgetHours}
          onChange={(e) => setForm({ ...form, budgetHours: e.target.value })}
        />
        <div className="rounded-lg bg-surface-2 border border-border px-4 py-3 text-sm text-text-secondary">
          Dados financeiros e de orçamento (valor/hora, tipo de orçamento, parcelas) podem ser visualizados e editados na{' '}
          <Link to={`/admin/projects/${id}/financial`} className="text-primary underline hover:text-primary/80">
            aba Financeiro
          </Link>
          .
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data Início"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="Data Fim"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <Select
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(v) => setForm({ ...form, status: v })}
        />

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={() => navigate(`/admin/projects/${id}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </SidebarLayout>
  );
}
