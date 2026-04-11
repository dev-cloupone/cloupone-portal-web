import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Skeleton } from '../components/ui/skeleton';
import { TicketStatusButton } from '../components/tickets/ticket-status-button';
import { TicketTimeline } from '../components/tickets/ticket-timeline';
import { TicketCommentForm } from '../components/tickets/ticket-comment-form';
import { TicketSidebar } from '../components/tickets/ticket-sidebar';
import { TicketDescription } from '../components/tickets/ticket-description';
import { ticketService } from '../services/ticket.service';
import { listAllocations } from '../services/project.service';
import { formatApiError } from '../services/api';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import { useToastStore } from '../stores/toast.store';
import type {
  Ticket,
  TicketComment,
  TicketHistoryEntry,
  TicketAttachment,
  TicketStatus,
  TicketPriority,
} from '../types/ticket.types';

interface TimeEntryRow {
  id: string;
  userName?: string;
  date: string;
  hours: number;
  description?: string;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryRow[]>([]);
  const [consultants, setConsultants] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
      return data;
    } catch (err) {
      setError(formatApiError(err));
      return null;
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ticketService.listComments(id);
      setComments(data);
    } catch { /* ignore */ }
  }, [id]);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ticketService.listHistory(id);
      setHistory(data);
    } catch { /* ignore */ }
  }, [id]);

  const loadAttachments = useCallback(async () => {
    if (!id) return;
    try {
      const resp = await ticketService.listAttachments(id);
      setAttachments(resp as TicketAttachment[]);
    } catch { /* ignore */ }
  }, [id]);

  const loadTimeEntries = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ticketService.listTimeEntries(id);
      setTimeEntries(data as TimeEntryRow[]);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const t = await loadTicket();
      const promises: Promise<unknown>[] = [loadComments(), loadHistory(), loadAttachments()];
      if (user?.role !== 'user') {
        promises.push(loadTimeEntries());
      }
      await Promise.all(promises);

      if (t && ['consultor', 'gestor', 'super_admin'].includes(user?.role || '')) {
        try {
          const result = await listAllocations(t.projectId);
          setConsultants(result.data.map((a) => ({ value: a.userId, label: a.userName })));
        } catch { /* ignore */ }
      }

      setLoading(false);
    }
    loadAll();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(status: TicketStatus) {
    if (!id) return;
    try {
      const updated = await ticketService.update(id, { status });
      setTicket(updated);
      await loadHistory();
      addToast('Status atualizado', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!id || priority === ticket?.priority) return;
    try {
      const updated = await ticketService.update(id, { priority });
      setTicket(updated);
      await loadHistory();
      addToast('Prioridade atualizada', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleAssigneeChange(assignedTo: string | null) {
    if (!id) return;
    try {
      const updated = await ticketService.update(id, { assignedTo });
      setTicket(updated);
      await loadHistory();
      addToast('Atribuicao atualizada', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleCommentSubmit(content: string, isInternal: boolean) {
    if (!id) return;
    try {
      await ticketService.addComment(id, { content, isInternal });
      await loadComments();
      addToast('Comentario adicionado', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleAttachmentUpload(file: File) {
    if (!id) return;
    setUploading(true);
    try {
      await ticketService.addAttachment(id, file);
      await loadAttachments();
      addToast('Anexo adicionado', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDescriptionSave(description: string) {
    if (!id) return;
    try {
      const updated = await ticketService.update(id, { description });
      setTicket(updated);
      await loadHistory();
      addToast('Descricao atualizada', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    }
  }

  async function handleAttachmentRemove(attachmentId: string) {
    if (!id) return;
    try {
      await ticketService.removeAttachment(id, attachmentId);
      await loadAttachments();
      addToast('Anexo removido', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  const isInternalUser = user?.role !== 'user';
  const isFinished = ticket?.status === 'finished';

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} title="Atendimento">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-60 rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !ticket) {
    return (
      <SidebarLayout navItems={navItems} title="Atendimento">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-danger mb-4">{error || 'Ticket nao encontrado'}</p>
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            Voltar para lista
          </button>
        </div>
      </SidebarLayout>
    );
  }

  const metadata = ticket.metadata as Record<string, string> | null;

  return (
    <SidebarLayout navItems={navItems} title="Atendimento">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div className="flex items-start gap-3 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            <span className="font-mono text-accent">{ticket.code}</span>
            <span className="mx-2 text-text-muted">—</span>
            {ticket.title}
          </h2>
          <TicketStatusButton
            status={ticket.status}
            userRole={user?.role || 'user'}
            onChange={handleStatusChange}
          />
          {isInternalUser && !ticket.isVisibleToClient && (
            <span className="inline-flex items-center rounded-md bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-muted border border-border">
              Interno
            </span>
          )}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <TicketDescription
            description={ticket.description}
            canEdit={ticket.status !== 'finished'}
            onSave={handleDescriptionSave}
          />

          {/* Metadata fields by type */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="rounded-xl border border-border bg-surface-1 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                {ticket.type === 'bug' && 'Detalhes do Bug'}
                {ticket.type === 'improvement' && 'Detalhes da Melhoria'}
                {ticket.type === 'initiative' && 'Detalhes da Iniciativa'}
              </h3>
              <div className="space-y-4">
                {metadata.stepsToReproduce && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Passos para Reproduzir</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.stepsToReproduce}</p>
                  </div>
                )}
                {metadata.expectedBehavior && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Comportamento Esperado</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.expectedBehavior}</p>
                  </div>
                )}
                {metadata.actualBehavior && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Comportamento Atual</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.actualBehavior}</p>
                  </div>
                )}
                {metadata.environment && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Ambiente</p>
                    <p className="text-sm text-text-secondary">{metadata.environment}</p>
                  </div>
                )}
                {metadata.currentSituation && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Situacao Atual</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.currentSituation}</p>
                  </div>
                )}
                {metadata.desiredSituation && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Situacao Desejada</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.desiredSituation}</p>
                  </div>
                )}
                {metadata.expectedBenefit && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Beneficio Esperado</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.expectedBenefit}</p>
                  </div>
                )}
                {metadata.objective && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Objetivo</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.objective}</p>
                  </div>
                )}
                {metadata.estimatedScope && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Escopo Estimado</p>
                    <p className="text-sm text-text-secondary">{metadata.estimatedScope}</p>
                  </div>
                )}
                {metadata.justification && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Justificativa</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{metadata.justification}</p>
                  </div>
                )}
                {metadata.stakeholders && (
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1">Stakeholders</p>
                    <p className="text-sm text-text-secondary">{metadata.stakeholders}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">Atividade</h3>
            <TicketTimeline comments={comments} history={history} />
          </div>

          {/* Comment form */}
          {!isFinished ? (
            <TicketCommentForm
              onSubmit={handleCommentSubmit}
              canMarkInternal={isInternalUser}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-text-muted">
              Ticket finalizado &mdash; comentarios desativados.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface-1 p-6 lg:sticky lg:top-6">
            <TicketSidebar
              ticket={ticket}
              userRole={user?.role || 'user'}
              userId={user?.id || ''}
              isInternalUser={isInternalUser}
              isFinished={isFinished}
              attachments={attachments}
              timeEntries={timeEntries}
              consultants={consultants}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              onAttachmentUpload={handleAttachmentUpload}
              onAttachmentRemove={handleAttachmentRemove}
              uploading={uploading}
            />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
