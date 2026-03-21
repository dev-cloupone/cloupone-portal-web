import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { DateInput } from '../components/ui/date-input';
import { ticketService } from '../services/ticket.service';
import { listProjects } from '../services/project.service';
import { listAllocations } from '../services/project.service';
import { formatApiError } from '../services/api';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import { useToastStore } from '../stores/toast.store';
import type { TicketType, CreateTicketData } from '../types/ticket.types';

const typeOptions = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Melhoria' },
  { value: 'initiative', label: 'Iniciativa' },
];

const priorityOptions = [
  { value: '', label: 'Media (padrao)' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
];

interface FormState {
  projectId: string;
  type: string;
  title: string;
  priority: string;
  description: string;
  isVisibleToClient: boolean;
  assignedTo: string;
  dueDate: string;
  estimatedHours: string;
  // Bug metadata
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
  // Improvement metadata
  currentSituation: string;
  desiredSituation: string;
  expectedBenefit: string;
  // Initiative metadata
  objective: string;
  estimatedScope: string;
  justification: string;
  stakeholders: string;
}

const emptyForm: FormState = {
  projectId: '',
  type: '',
  title: '',
  priority: '',
  description: '',
  isVisibleToClient: true,
  assignedTo: '',
  dueDate: '',
  estimatedHours: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  actualBehavior: '',
  environment: '',
  currentSituation: '',
  desiredSituation: '',
  expectedBenefit: '',
  objective: '',
  estimatedScope: '',
  justification: '',
  stakeholders: '',
};

export default function TicketNewPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [consultants, setConsultants] = useState<{ value: string; label: string }[]>([]);

  const isInternalUser = user?.role !== 'user';
  const isManager = user?.role === 'gestor' || user?.role === 'super_admin';

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await listProjects({ limit: 100, status: 'active' });
        setProjects(result.data.map((p) => ({ id: p.id, name: p.name })));
      } catch (err) { console.error(err); }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (!form.projectId || !isManager) {
      setConsultants([]);
      return;
    }
    async function loadAllocations() {
      try {
        const result = await listAllocations(form.projectId);
        setConsultants(
          result.data.map((a) => ({ value: a.userId, label: a.userName }))
        );
      } catch { /* ignore */ }
    }
    loadAllocations();
  }, [form.projectId, isManager]);

  function buildMetadata(): Record<string, unknown> | undefined {
    const type = form.type as TicketType;
    if (type === 'bug') {
      const meta: Record<string, string> = {};
      if (form.stepsToReproduce) meta.stepsToReproduce = form.stepsToReproduce;
      if (form.expectedBehavior) meta.expectedBehavior = form.expectedBehavior;
      if (form.actualBehavior) meta.actualBehavior = form.actualBehavior;
      if (form.environment) meta.environment = form.environment;
      return Object.keys(meta).length > 0 ? meta : undefined;
    }
    if (type === 'improvement') {
      const meta: Record<string, string> = {};
      if (form.currentSituation) meta.currentSituation = form.currentSituation;
      if (form.desiredSituation) meta.desiredSituation = form.desiredSituation;
      if (form.expectedBenefit) meta.expectedBenefit = form.expectedBenefit;
      return Object.keys(meta).length > 0 ? meta : undefined;
    }
    if (type === 'initiative') {
      const meta: Record<string, string> = {};
      if (form.objective) meta.objective = form.objective;
      if (form.estimatedScope) meta.estimatedScope = form.estimatedScope;
      if (form.justification) meta.justification = form.justification;
      if (form.stakeholders) meta.stakeholders = form.stakeholders;
      return Object.keys(meta).length > 0 ? meta : undefined;
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data: CreateTicketData = {
        projectId: form.projectId,
        type: form.type as TicketType,
        title: form.title,
        description: form.description || undefined,
        priority: (form.priority as CreateTicketData['priority']) || undefined,
        metadata: buildMetadata(),
        isVisibleToClient: isInternalUser ? form.isVisibleToClient : undefined,
        assignedTo: isManager && form.assignedTo ? form.assignedTo : undefined,
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      };

      const ticket = await ticketService.create(data);
      addToast('Ticket criado com sucesso!', 'success');
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const projectOptions = [
    { value: '', label: 'Selecione o projeto' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const consultantOptions = [
    { value: '', label: 'Sem atribuicao' },
    ...consultants,
  ];

  return (
    <SidebarLayout navItems={navItems} title="Atendimento">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Novo Ticket</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Informacoes Basicas</h3>

          <Select
            label="Projeto"
            options={projectOptions}
            value={form.projectId}
            onChange={(v) => update('projectId', v)}
            required
          />

          <Select
            label="Tipo"
            options={typeOptions}
            value={form.type}
            onChange={(v) => update('type', v)}
            required
          />

          <Input
            label="Titulo"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Descreva brevemente o ticket..."
            required
          />

          <Select
            label="Prioridade"
            options={priorityOptions}
            value={form.priority}
            onChange={(v) => update('priority', v)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder="Descreva em detalhes o ticket (suporta Markdown)..."
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Dynamic fields by type */}
        {form.type === 'bug' && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Detalhes do Bug</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Passos para Reproduzir</label>
              <textarea
                value={form.stepsToReproduce}
                onChange={(e) => update('stepsToReproduce', e.target.value)}
                rows={3}
                placeholder="1. Acesse a pagina...\n2. Clique em...\n3. Observe que..."
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Comportamento Esperado</label>
              <textarea
                value={form.expectedBehavior}
                onChange={(e) => update('expectedBehavior', e.target.value)}
                rows={2}
                placeholder="O sistema deveria..."
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Comportamento Atual</label>
              <textarea
                value={form.actualBehavior}
                onChange={(e) => update('actualBehavior', e.target.value)}
                rows={2}
                placeholder="O sistema esta..."
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <Input
              label="Ambiente"
              value={form.environment}
              onChange={(e) => update('environment', e.target.value)}
              placeholder="Ex: Chrome 120, Windows 11, Producao"
            />
          </div>
        )}

        {form.type === 'improvement' && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Detalhes da Melhoria</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Situacao Atual</label>
              <textarea
                value={form.currentSituation}
                onChange={(e) => update('currentSituation', e.target.value)}
                rows={3}
                placeholder="Descreva como funciona hoje..."
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Situacao Desejada</label>
              <textarea
                value={form.desiredSituation}
                onChange={(e) => update('desiredSituation', e.target.value)}
                rows={3}
                placeholder="Descreva como deveria funcionar..."
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Beneficio Esperado</label>
              <textarea
                value={form.expectedBenefit}
                onChange={(e) => update('expectedBenefit', e.target.value)}
                rows={2}
                placeholder="Qual o beneficio desta melhoria?"
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
          </div>
        )}

        {form.type === 'initiative' && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Detalhes da Iniciativa</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Objetivo</label>
              <textarea
                value={form.objective}
                onChange={(e) => update('objective', e.target.value)}
                rows={3}
                placeholder="Qual o objetivo desta iniciativa?"
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <Input
              label="Escopo Estimado"
              value={form.estimatedScope}
              onChange={(e) => update('estimatedScope', e.target.value)}
              placeholder="Ex: Modulo completo, Integracao, Relatorio"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">Justificativa</label>
              <textarea
                value={form.justification}
                onChange={(e) => update('justification', e.target.value)}
                rows={2}
                placeholder="Por que esta iniciativa e importante?"
                className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
              />
            </div>
            <Input
              label="Stakeholders"
              value={form.stakeholders}
              onChange={(e) => update('stakeholders', e.target.value)}
              placeholder="Partes interessadas nesta iniciativa"
            />
          </div>
        )}

        {/* Advanced options */}
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Opcoes Adicionais</h3>

          {isInternalUser && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!form.isVisibleToClient}
                onChange={(e) => update('isVisibleToClient', !e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface-2 text-accent focus:ring-accent focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary">Ticket interno (nao visivel ao cliente)</span>
            </label>
          )}

          {isManager && (
            <Select
              label="Atribuir Consultor"
              options={consultantOptions}
              value={form.assignedTo}
              onChange={(v) => update('assignedTo', v)}
              disabled={!form.projectId}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateInput
              label="Prazo Esperado"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
            />
            <Input
              label="Estimativa (horas)"
              type="number"
              value={form.estimatedHours}
              onChange={(e) => update('estimatedHours', e.target.value)}
              placeholder="Ex: 8"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/tickets')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || !form.projectId || !form.type || !form.title}>
            {submitting ? 'Criando...' : 'Criar Ticket'}
          </Button>
        </div>
      </form>
    </SidebarLayout>
  );
}
