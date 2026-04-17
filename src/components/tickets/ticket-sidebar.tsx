import { Calendar, Clock, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { TicketTypeBadge } from './ticket-type-badge';
import { TicketAttachments } from './ticket-attachments';
import { TicketTimeEntries } from './ticket-time-entries';
import {
  TICKET_PRIORITY_LABELS,
  type Ticket,
  type TicketAttachment,
  type TicketPriority,
} from '../../types/ticket.types';

interface TimeEntryRow {
  id: string;
  userName?: string;
  date: string;
  hours: number;
  description?: string;
}

interface TicketSidebarProps {
  ticket: Ticket;
  userRole: string;
  userId: string;
  isInternalUser: boolean;
  isFinished: boolean;
  attachments: TicketAttachment[];
  timeEntries: TimeEntryRow[];
  consultants: { value: string; label: string }[];
  onPriorityChange: (priority: TicketPriority) => void;
  onAssigneeChange: (userId: string | null) => void;
  onAttachmentUpload: (file: File) => Promise<void>;
  onAttachmentRemove: (attachmentId: string) => Promise<void>;
  uploading?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function TicketSidebar({
  ticket,
  userRole,
  userId,
  isInternalUser,
  isFinished,
  attachments,
  timeEntries,
  consultants,
  onPriorityChange,
  onAssigneeChange,
  onAttachmentUpload,
  onAttachmentRemove,
  uploading,
}: TicketSidebarProps) {
  const canChangePriority = !isFinished && ['consultor', 'gestor', 'super_admin'].includes(userRole);
  const canChangeAssignee = !isFinished && ['consultor', 'gestor', 'super_admin'].includes(userRole);

  const priorityOptions = Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const assigneeOptions = [
    { value: '', label: 'Sem atribuicao' },
    ...consultants,
  ];
  if (
    ticket.assignedTo &&
    !assigneeOptions.some((o) => o.value === ticket.assignedTo)
  ) {
    assigneeOptions.push({
      value: ticket.assignedTo,
      label: ticket.assignedToName || ticket.assignedTo,
    });
  }

  return (
    <div className="space-y-6">
      {/* Priority */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Prioridade</h4>
        {canChangePriority ? (
          <Select
            options={priorityOptions}
            value={ticket.priority}
            onChange={(v) => onPriorityChange(v as TicketPriority)}
          />
        ) : (
          <TicketPriorityBadge priority={ticket.priority} />
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Tipo</h4>
        <TicketTypeBadge type={ticket.type} />
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Atribuido a</h4>
        {canChangeAssignee ? (
          <>
            <Select
              options={assigneeOptions}
              value={ticket.assignedTo || ''}
              onChange={(v) => onAssigneeChange(v || null)}
            />
            {ticket.assignedTo !== userId && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-1.5"
                onClick={() => onAssigneeChange(userId)}
              >
                Atribuir a mim
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <UserIcon size={14} className="text-text-muted" />
            {ticket.assignedToName || <span className="text-text-muted">Sem atribuicao</span>}
          </div>
        )}
      </div>

      {/* Project */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Projeto</h4>
        <p className="text-sm text-text-secondary">{ticket.projectName}</p>
        {ticket.clientName && (
          <p className="text-xs text-text-muted">{ticket.clientName}</p>
        )}
      </div>

      {/* Created by */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Criado por</h4>
        <p className="text-sm text-text-secondary">{ticket.createdByName}</p>
        <p className="text-xs text-text-muted">{formatDate(ticket.createdAt)}</p>
      </div>

      {/* Due date */}
      {ticket.dueDate && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Prazo</h4>
          <div className="flex items-center gap-2">
            <Calendar size={14} className={isOverdue(ticket.dueDate) ? 'text-danger' : 'text-text-muted'} />
            <span className={`text-sm ${isOverdue(ticket.dueDate) ? 'text-danger font-medium' : 'text-text-secondary'}`}>
              {formatDate(ticket.dueDate)}
              {isOverdue(ticket.dueDate) && ' (atrasado)'}
            </span>
          </div>
        </div>
      )}

      {/* Estimated hours */}
      {isInternalUser && ticket.estimatedHours != null && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Estimativa</h4>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-text-muted" />
            <span className="text-sm text-text-secondary">{ticket.estimatedHours}h</span>
          </div>
        </div>
      )}

      {/* Visibility */}
      {userRole !== 'client' && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Visibilidade</h4>
          <div className="flex items-center gap-2 text-sm">
            {ticket.isVisibleToClient ? (
              <>
                <Eye size={14} className="text-accent" />
                <span className="text-text-secondary">Visivel ao cliente</span>
              </>
            ) : (
              <>
                <EyeOff size={14} className="text-warning" />
                <span className="text-warning">Ticket interno</span>
              </>
            )}
          </div>
        </div>
      )}

      <hr className="border-border" />

      {/* Attachments */}
      <TicketAttachments
        attachments={attachments}
        onUpload={onAttachmentUpload}
        onRemove={onAttachmentRemove}
        canRemove={(a) =>
          a.uploadedBy === userId || ['gestor', 'super_admin'].includes(userRole)
        }
        uploading={uploading}
        readOnly={isFinished}
      />

      {isInternalUser && (
        <>
          <hr className="border-border" />
          {/* Time entries */}
          <TicketTimeEntries entries={timeEntries} estimatedHours={ticket.estimatedHours} />
        </>
      )}
    </div>
  );
}
