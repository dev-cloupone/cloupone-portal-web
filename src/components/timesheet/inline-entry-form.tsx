import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { TimePicker } from '../ui/time-picker';
import type { TimeEntry, UpsertEntryData } from '../../types/time-entry.types';
import type { Ticket } from '../../types/ticket.types';
import { ticketService } from '../../services/ticket.service';
import * as phaseService from '../../services/phase.service';
import type { AvailableSubphase } from '../../types/phase.types';

interface AllocatedProject {
  projectId: string;
  projectName: string;
  clientName: string;
}

interface InlineEntryFormProps {
  date: string;
  entry?: TimeEntry | null;
  projects: AllocatedProject[];
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
  existingEntries = [],
  onSave,
  onCancel,
}: InlineEntryFormProps) {
  const [projectId, setProjectId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [subphaseId, setSubphaseId] = useState('');
  const [availableSubphases, setAvailableSubphases] = useState<AvailableSubphase[]>([]);
  const [projectTickets, setProjectTickets] = useState<Ticket[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize form
  useEffect(() => {
    if (entry) {
      setProjectId(entry.projectId);
      setStartTime(entry.startTime.slice(0, 5));
      setEndTime(entry.endTime.slice(0, 5));
      setDescription(entry.description || '');
      setTicketId(entry.ticketId || '');
      setSubphaseId(entry.subphaseId || '');
    } else {
      const filteredExisting = existingEntries.filter(e => e.date === date);
      const suggested = suggestStartTime(filteredExisting);
      setProjectId(projects.length === 1 ? projects[0].projectId : '');
      setStartTime(suggested);
      setEndTime('');
      setDescription('');
      setTicketId('');
      setSubphaseId('');
    }
    setError('');
  }, [entry, date, existingEntries, projects]);

  // Load available subphases when project changes
  useEffect(() => {
    if (!projectId) {
      setAvailableSubphases([]);
      return;
    }
    phaseService.listAvailableSubphases(projectId)
      .then(res => setAvailableSubphases(res.data))
      .catch(() => setAvailableSubphases([]));
  }, [projectId]);

  // Load tickets when project changes
  useEffect(() => {
    if (!projectId) {
      setProjectTickets([]);
      return;
    }
    ticketService.list({
      projectId,
      status: 'open,in_analysis,awaiting_customer,awaiting_third_party',
      limit: 100,
    }).then(res => setProjectTickets(res.data)).catch(() => setProjectTickets([]));
  }, [projectId]);

  const isEditable = true;
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
        date,
        startTime,
        endTime,
        description: description || undefined,
        ticketId: ticketId || null,
        subphaseId: subphaseId || null,
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
            setSubphaseId('');
          }}
          options={projectOptions}
          placeholder="Selecione um projeto"
          disabled={!isEditable}
          required
        />

        {projectId && (
          <div className="space-y-1.5">
            {(() => {
              const opts = availableSubphases.map(sp => ({
                value: sp.id,
                label: `${sp.phaseName} → ${sp.name}`,
              }));
              const currentNotInList = subphaseId && !availableSubphases.find(sp => sp.id === subphaseId);
              if (currentNotInList) {
                opts.unshift({ value: subphaseId, label: `Subfase anterior (não disponível)` });
              }
              return (
                <Select
                  label="Subfase"
                  value={subphaseId}
                  onChange={setSubphaseId}
                  options={opts}
                  placeholder={opts.length === 0
                    ? 'Nenhuma subfase disponível'
                    : 'Selecione uma subfase'}
                  disabled={opts.length === 0}
                  required={!entry}
                />
              );
            })()}
            {subphaseId && !availableSubphases.find(sp => sp.id === subphaseId) && (
              <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2">
                <p className="text-xs text-warning">
                  Você não está mais vinculado a esta subfase. Selecione outra ou solicite ao gestor.
                </p>
              </div>
            )}
            {availableSubphases.length === 0 && !subphaseId && (
              <p className="text-xs text-warning">
                Nenhuma subfase em andamento com você vinculado. Solicite ao gestor.
              </p>
            )}
            {(() => {
              const selected = availableSubphases.find(sp => sp.id === subphaseId);
              if (!selected || !selected.consultantEstimatedHours) return null;
              const estimated = Number(selected.consultantEstimatedHours);
              const actual = selected.consultantActualHours;
              const pct = estimated > 0 ? (actual / estimated) * 100 : 0;
              if (pct < 80) return null;
              return (
                <div className={`rounded-lg border px-3 py-2 ${pct >= 100 ? 'bg-danger-muted border-danger/20' : 'bg-warning-muted border-warning/20'}`}>
                  <p className={`text-xs ${pct >= 100 ? 'text-danger' : 'text-warning'}`}>
                    {pct >= 100
                      ? `Horas estimadas excedidas: ${actual.toFixed(1)}h de ${estimated.toFixed(1)}h (${pct.toFixed(0)}%)`
                      : `Próximo do limite: ${actual.toFixed(1)}h de ${estimated.toFixed(1)}h (${pct.toFixed(0)}%)`}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

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
