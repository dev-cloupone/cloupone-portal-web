import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ArrowLeft, Paperclip, Trash2, FileText, Image, Film, FileArchive } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { CcEmailsInput } from '../components/tickets/cc-emails-input';
import { ticketService } from '../services/ticket.service';
import { listProjects } from '../services/project.service';
import { formatApiError } from '../services/api';
import { useNavItems } from '../hooks/use-nav-items';
import { useToastStore } from '../stores/toast.store';
import type { TicketType, CreateTicketData } from '../types/ticket.types';


interface FormState {
  projectId: string;
  type: string;
  title: string;
  priority: string;
  description: string;
  ccEmails: string[];
}

const emptyForm: FormState = {
  projectId: '',
  type: '',
  title: '',
  priority: '',
  description: '',
  ccEmails: [],
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
  const { t } = useTranslation();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const typeOptions = [
    { value: '', label: t('tickets.selectType') },
    { value: 'system_error', label: t('tickets.typeBug') },
    { value: 'question', label: t('tickets.typeQuestion') },
    { value: 'improvement', label: t('tickets.typeFeature') },
    { value: 'security', label: t('tickets.typeSecurity') },
  ];

  const priorityOptions = [
    { value: '', label: t('tickets.defaultPriority') },
    { value: 'low', label: t('tickets.priorityLow') },
    { value: 'medium', label: t('tickets.priorityMedium') },
    { value: 'high', label: t('tickets.priorityHigh') },
    { value: 'critical', label: t('tickets.priorityCritical') },
  ];
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
        ccEmails: form.ccEmails.length > 0 ? form.ccEmails : undefined,
      };

      const ticket = await ticketService.create(data);

      // Upload attachments sequentially so errors can be reported per file
      for (const file of attachments) {
        try {
          await ticketService.addAttachment(ticket.id, file);
        } catch (err) {
          addToast(t('common.failedToAttach', { name: file.name, error: formatApiError(err) }), 'error');
        }
      }

      addToast(t('tickets.ticketCreated'), 'success');
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
    { value: '', label: t('tickets.selectProject') },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <SidebarLayout navItems={navItems} title={t('tickets.support')}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('tickets.newTicket')}</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{t('tickets.basicInfo')}</h3>

          <Select
            label={t('tickets.project')}
            options={projectOptions}
            value={form.projectId}
            onChange={(v) => update('projectId', v)}
            required
          />

          <Select
            label={t('tickets.type')}
            options={typeOptions}
            value={form.type}
            onChange={(v) => update('type', v)}
            required
          />

          <Input
            label={t('tickets.titleLabel')}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={t('tickets.describeBriefly')}
            required
          />

          <Select
            label={t('tickets.priority')}
            options={priorityOptions}
            value={form.priority}
            onChange={(v) => update('priority', v)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('common.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder={t('tickets.describeInDetail')}
              className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            {t('tickets.ccEmails')}
          </h3>
          <CcEmailsInput
            value={form.ccEmails}
            onChange={(emails) => setForm((prev) => ({ ...prev, ccEmails: emails }))}
          />
          <p className="text-xs text-text-muted">
            {t('tickets.ccEmailsDescription')}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{t('common.attachments')}</h3>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={14} className="mr-1.5" />
              {t('common.addAttachment')}
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
            <p className="text-xs text-text-muted">{t('tickets.selectedAttachments')}</p>
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
                    title={t('common.delete')}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting || !form.projectId || !form.type || !form.title}>
            {submitting ? t('tickets.creating') : t('tickets.createTicket')}
          </Button>
        </div>
      </form>
    </SidebarLayout>
  );
}
