import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { TimePicker } from '../ui/time-picker';
import type { TimeEntry, UpsertEntryData } from '../../types/time-entry.types';
import type { ActivityCategory } from '../../types/activity-category.types';
import type { Ticket } from '../../types/ticket.types';
import { ticketService } from '../../services/ticket.service';

interface AllocatedProject {
  projectId: string;
  projectName: string;
  clientName: string;
}

interface InlineEntryFormProps {
  date: string;
  entry?: TimeEntry | null;
  projects: AllocatedProject[];
  categories: ActivityCategory[];
  existingEntries?: TimeEntry[];
  onSave: (data: UpsertEntryData) => Promise<void>;
  onCancel: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '';
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin) return '';
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function suggestStartTime(existingEntries: TimeEntry[]): string {
  if (existingEntries.length === 0) return '08:00';
  const sorted = [...existingEntries].sort((a, b) => a.endTime.localeCompare(b.endTime));
  const lastEnd = sorted[sorted.length - 1].endTime.slice(0, 5);
  const lastEndMin = timeToMinutes(lastEnd);
  if (lastEndMin >= 11 * 60 && lastEndMin <= 13 * 60) return '13:00';
  return lastEnd;
}

export function InlineEntryForm({
  date,
  entry = null,
  projects,
  categories,
  existingEntries = [],
  onSave,
  onCancel,
}: InlineEntryFormProps) {
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [projectTickets, setProjectTickets] = useState<Ticket[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize form
  useEffect(() => {
    if (entry) {
      setProjectId(entry.projectId);
      setCategoryId(entry.categoryId || '');
      setStartTime(entry.startTime.slice(0, 5));
      setEndTime(entry.endTime.slice(0, 5));
      setDescription(entry.description || '');
      setTicketId(entry.ticketId || '');
    } else {
      const filteredExisting = existingEntries.filter(e => e.date === date);
      const suggested = suggestStartTime(filteredExisting);
      setProjectId(projects.length === 1 ? projects[0].projectId : '');
      setCategoryId('');
      setStartTime(suggested);
      setEndTime('');
      setDescription('');
      setTicketId('');
    }
    setError('');
  }, [entry, date, existingEntries, projects]);

  // Load tickets when project changes
  useEffect(() => {
    if (!projectId) {
      setProjectTickets([]);
      return;
    }
    ticketService.list({
      projectId,
      status: 'open,in_analysis,in_progress,in_review',
      limit: 100,
    }).then(res => setProjectTickets(res.data)).catch(() => setProjectTickets([]));
  }, [projectId]);

  const isEditable = !entry || entry.status === 'draft' || entry.status === 'rejected';
  const duration = useMemo(() => formatDuration(startTime, endTime), [startTime, endTime]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !startTime || !endTime) return;

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        id: entry?.id,
        projectId,
        categoryId: categoryId || null,
        date,
        startTime,
        endTime,
        description: description || undefined,
        ticketId: ticketId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar registro.');
    } finally {
      setIsSaving(false);
    }
  }

  const projectOptions = projects.map(p => ({
    value: p.projectId,
    label: `${p.projectName} (${p.clientName})`,
  }));

  const categoryOptions = categories
    .filter(c => c.isActive)
    .map(c => ({ value: c.id, label: `${c.name}${c.isBillable ? '' : ' (nao faturavel)'}` }));

  const ticketOptions = projectTickets.map(t => ({
    value: t.id,
    label: `${t.code} — ${t.title}`,
  }));

  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });

  const title = entry ? 'Editar Apontamento' : 'Novo Apontamento';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" /> Voltar
        </button>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </div>

      <p className="text-xs text-text-muted mb-4 capitalize">{dateDisplay}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rejection comment */}
        {entry?.status === 'rejected' && entry.rejectionComment && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-danger" />
              <span className="text-xs font-semibold uppercase tracking-wider text-danger">Motivo da rejeicao</span>
            </div>
            <p className="text-sm text-text-primary">{entry.rejectionComment}</p>
          </div>
        )}

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <TimePicker
            label="Inicio"
            value={startTime}
            onChange={setStartTime}
            disabled={!isEditable}
          />
          <TimePicker
            label="Fim"
            value={endTime}
            onChange={setEndTime}
            disabled={!isEditable}
          />
        </div>

        {duration && (
          <div className="text-xs text-text-muted">
            Duracao: <span className="font-medium text-text-secondary">{duration}</span>
          </div>
        )}

        <Select
          label="Projeto"
          value={projectId}
          onChange={(v) => {
            setProjectId(v);
            setTicketId('');
          }}
          options={projectOptions}
          placeholder="Selecione um projeto"
          disabled={!isEditable}
          required
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={setCategoryId}
          options={categoryOptions}
          placeholder="Selecione uma categoria"
          disabled={!isEditable}
        />

        {ticketOptions.length > 0 && (
          <Select
            label="Ticket relacionado"
            value={ticketId}
            onChange={setTicketId}
            options={ticketOptions}
            placeholder="Nenhum (opcional)"
            disabled={!isEditable}
          />
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Descricao
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={!isEditable}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none disabled:opacity-40"
            placeholder="Descreva a atividade realizada..."
          />
          <div className="text-right text-caption text-text-muted">
            {description.length}/500
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isSaving} className="flex-1">
            Cancelar
          </Button>
          {isEditable && (
            <Button type="submit" disabled={isSaving || !projectId || !startTime || !endTime} className="flex-1">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
