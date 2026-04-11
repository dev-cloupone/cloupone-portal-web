import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Paperclip, Trash2, FileText, Image, Film, FileArchive } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { ticketService } from '../services/ticket.service';
import { listProjects } from '../services/project.service';
import { formatApiError } from '../services/api';
import { useNavItems } from '../hooks/use-nav-items';
import { useToastStore } from '../stores/toast.store';
import type { TicketType, CreateTicketData } from '../types/ticket.types';

const typeOptions = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'system_error', label: 'Erro de sistema' },
  { value: 'question', label: 'Dúvida' },
  { value: 'improvement', label: 'Solicitação de melhoria' },
  { value: 'security', label: 'Segurança/Acesso' },
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
}

const emptyForm: FormState = {
  projectId: '',
  type: '',
  title: '',
  priority: '',
  description: '',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={16} />;
  if (mimeType.startsWith('video/')) return <Film size={16} />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive size={16} />;
  return <FileText size={16} />;
}

export default function TicketNewPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await listProjects({ limit: 100, status: 'active' });
        setProjects(result.data.map((p) => ({ id: p.id, name: p.name })));
      } catch (err) { console.error(err); }
    }
    loadProjects();
  }, []);

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
      };

      const ticket = await ticketService.create(data);

      // Upload attachments sequentially so errors can be reported per file
      for (const file of attachments) {
        try {
          await ticketService.addAttachment(ticket.id, file);
        } catch (err) {
          addToast(`Falha ao anexar ${file.name}: ${formatApiError(err)}`, 'error');
        }
      }

      addToast('Ticket criado com sucesso!', 'success');
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  const projectOptions = [
    { value: '', label: 'Selecione o projeto' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
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

        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Anexos</h3>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={14} className="mr-1.5" />
              Adicionar anexo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum anexo selecionado</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
                >
                  <div className="text-text-muted shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{file.name}</p>
                    <p className="text-[11px] text-text-muted">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1 text-text-muted hover:text-danger transition-colors shrink-0"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
