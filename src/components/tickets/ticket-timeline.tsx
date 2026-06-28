import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useLocaleStore } from '../../stores/locale.store';

type TimelineItem =
  | { kind: 'comment'; data: TicketComment; date: string }
  | { kind: 'history'; data: TicketHistoryEntry; date: string };

interface TicketTimelineProps {
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  status: 'tickets.fieldStatus',
  priority: 'tickets.fieldPriority',
  type: 'tickets.fieldType',
  assigned_to: 'tickets.fieldAssigned',
  assignedTo: 'tickets.fieldAssigned',
  title: 'tickets.fieldTitle',
  description: 'tickets.fieldDescription',
  is_visible_to_client: 'tickets.fieldVisibility',
  isVisibleToClient: 'tickets.fieldVisibility',
  due_date: 'tickets.fieldDeadline',
  dueDate: 'tickets.fieldDeadline',
  estimated_hours: 'tickets.fieldEstimate',
  estimatedHours: 'tickets.fieldEstimate',
};

function formatFieldValue(field: string, value: string | null, t: (key: string) => string): string {
  if (value === null || value === '') return '—';
  if (field === 'status') return t(TICKET_STATUS_LABELS[value as keyof typeof TICKET_STATUS_LABELS] || value);
  if (field === 'priority') return t(TICKET_PRIORITY_LABELS[value as keyof typeof TICKET_PRIORITY_LABELS] || value);
  if (field === 'type') return t(TICKET_TYPE_LABELS[value as keyof typeof TICKET_TYPE_LABELS] || value);
  if (field === 'is_visible_to_client' || field === 'isVisibleToClient') return value === 'true' ? t('common.visible') : t('common.internal');
  return value;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(useLocaleStore.getState().locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function TicketTimeline({ comments, history }: TicketTimelineProps) {
  const { t } = useTranslation();
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
        {t('tickets.noActivityYet')}
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
                    <Badge variant="warning">{t('tickets.internalNoteLabel')}</Badge>
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
        const fieldLabelKey = FIELD_LABELS[entry.field];
        const fieldLabel = fieldLabelKey ? t(fieldLabelKey) : entry.field;

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
                  {t('tickets.editedDescription')}
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
                {t('tickets.changed')}
                <span className="font-medium text-text-secondary">{fieldLabel}</span>
                {entry.oldValue && (
                  <>
                    {t('tickets.from')}
                    <span className="font-medium text-text-secondary">{formatFieldValue(entry.field, entry.oldValue, t)}</span>
                  </>
                )}
                {t('tickets.to')}
                <span className="font-medium text-text-secondary">{formatFieldValue(entry.field, entry.newValue, t)}</span>
              </p>
            </div>
            <span className="text-[11px] text-text-muted shrink-0">{formatDateTime(entry.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
