import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, History } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  type TicketComment,
  type TicketHistoryEntry,
} from '../../types/ticket.types';

type TimelineItem =
  | { kind: 'comment'; data: TicketComment; date: string }
  | { kind: 'history'; data: TicketHistoryEntry; date: string };

interface TicketTimelineProps {
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  priority: 'Prioridade',
  type: 'Tipo',
  assigned_to: 'Atribuido a',
  assignedTo: 'Atribuido a',
  title: 'Título',
  description: 'Descrição',
  is_visible_to_client: 'Visibilidade',
  isVisibleToClient: 'Visibilidade',
  due_date: 'Prazo',
  dueDate: 'Prazo',
  estimated_hours: 'Estimativa',
  estimatedHours: 'Estimativa',
};

function formatFieldValue(field: string, value: string | null): string {
  if (value === null || value === '') return '—';
  if (field === 'status') return TICKET_STATUS_LABELS[value as keyof typeof TICKET_STATUS_LABELS] || value;
  if (field === 'priority') return TICKET_PRIORITY_LABELS[value as keyof typeof TICKET_PRIORITY_LABELS] || value;
  if (field === 'type') return TICKET_TYPE_LABELS[value as keyof typeof TICKET_TYPE_LABELS] || value;
  if (field === 'is_visible_to_client' || field === 'isVisibleToClient') return value === 'true' ? 'Visivel' : 'Interno';
  return value;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function TicketTimeline({ comments, history }: TicketTimelineProps) {
  const items = useMemo<TimelineItem[]>(() => {
    const all: TimelineItem[] = [
      ...comments.map((c) => ({ kind: 'comment' as const, data: c, date: c.createdAt })),
      ...history.map((h) => ({ kind: 'history' as const, data: h, date: h.createdAt })),
    ];
    all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return all;
  }, [comments, history]);

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        if (item.kind === 'comment') {
          const comment = item.data;
          return (
            <div
              key={`comment-${comment.id}`}
              className={`rounded-xl border p-4 ${
                comment.isInternal
                  ? 'border-warning/30 bg-warning-muted/30'
                  : 'border-border bg-surface-1'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <MessageSquare size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{comment.userName}</span>
                  {comment.isInternal && (
                    <Badge variant="warning">Nota Interna</Badge>
                  )}
                </div>
                <span className="text-xs text-text-muted">{formatDateTime(comment.createdAt)}</span>
              </div>
              <div className="pl-9 prose prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg">
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
            </div>
          );
        }

        const entry = item.data;
        const fieldLabel = FIELD_LABELS[entry.field] || entry.field;

        if (entry.field === 'description') {
          return (
            <div
              key={`history-${entry.id}`}
              className="flex items-start gap-3 py-2 px-4"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-muted mt-0.5">
                <History size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">
                  <span className="font-medium text-text-secondary">{entry.userName}</span>
                  {' editou a descricao'}
                </p>
              </div>
              <span className="text-[11px] text-text-muted shrink-0">{formatDateTime(entry.createdAt)}</span>
            </div>
          );
        }

        return (
          <div
            key={`history-${entry.id}`}
            className="flex items-start gap-3 py-2 px-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-muted mt-0.5">
              <History size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">
                <span className="font-medium text-text-secondary">{entry.userName}</span>
                {' mudou '}
                <span className="font-medium text-text-secondary">{fieldLabel}</span>
                {entry.oldValue && (
                  <>
                    {' de '}
                    <span className="font-medium text-text-secondary">{formatFieldValue(entry.field, entry.oldValue)}</span>
                  </>
                )}
                {' para '}
                <span className="font-medium text-text-secondary">{formatFieldValue(entry.field, entry.newValue)}</span>
              </p>
            </div>
            <span className="text-[11px] text-text-muted shrink-0">{formatDateTime(entry.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
