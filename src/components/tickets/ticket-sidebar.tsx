import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { CcEmailsInput } from './cc-emails-input';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { TicketTypeBadge } from './ticket-type-badge';
import { TicketAttachments } from './ticket-attachments';
import { TicketTimeEntries } from './ticket-time-entries';
import { useLocaleStore } from '../../stores/locale.store';
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
  onCcEmailsChange: (emails: string[]) => void;
  onAttachmentUpload: (file: File) => Promise<void>;
  onAttachmentRemove: (attachmentId: string) => Promise<void>;
  uploading?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(useLocaleStore.getState().locale);
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
  onCcEmailsChange,
  onAttachmentUpload,
  onAttachmentRemove,
  uploading,
}: TicketSidebarProps) {
  const { t } = useTranslation();
  const canChangePriority = !isFinished && ['consultor', 'gestor', 'super_admin'].includes(userRole);
  const canChangeAssignee = !isFinished && ['consultor', 'gestor', 'super_admin'].includes(userRole);

  const priorityOptions = Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label: t(label),
  }));

  const assigneeOptions = [
    { value: '', label: t('tickets.noAssignment') },
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
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.priority')}</h4>
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
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.type')}</h4>
        <TicketTypeBadge type={ticket.type} />
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.fieldAssigned')}</h4>
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
                {t('tickets.assignToMe')}
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <UserIcon size={14} className="text-text-muted" />
            {ticket.assignedToName || <span className="text-text-muted">{t('tickets.noAssignment')}</span>}
          </div>
        )}
      </div>

      {/* Project */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.project')}</h4>
        <p className="text-sm text-text-secondary">{ticket.projectName}</p>
        {ticket.clientName && (
          <p className="text-xs text-text-muted">{ticket.clientName}</p>
        )}
      </div>

      {/* Created by */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.createdBy')}</h4>
        <p className="text-sm text-text-secondary">{ticket.createdByName}</p>
        <p className="text-xs text-text-muted">{formatDate(ticket.createdAt)}</p>
      </div>

      {/* Due date */}
      {ticket.dueDate && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.deadline')}</h4>
          <div className="flex items-center gap-2">
            <Calendar size={14} className={isOverdue(ticket.dueDate) ? 'text-danger' : 'text-text-muted'} />
            <span className={`text-sm ${isOverdue(ticket.dueDate) ? 'text-danger font-medium' : 'text-text-secondary'}`}>
              {formatDate(ticket.dueDate)}
              {isOverdue(ticket.dueDate) && ` ${t('tickets.overdue')}`}
            </span>
          </div>
        </div>
      )}

      {/* Estimated hours */}
      {isInternalUser && ticket.estimatedHours != null && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.estimate')}</h4>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-text-muted" />
            <span className="text-sm text-text-secondary">{ticket.estimatedHours}h</span>
          </div>
        </div>
      )}

      {/* Visibility */}
      {userRole !== 'client' && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('tickets.visibility')}</h4>
          <div className="flex items-center gap-2 text-sm">
            {ticket.isVisibleToClient ? (
              <>
                <Eye size={14} className="text-accent" />
                <span className="text-text-secondary">{t('tickets.visibleToClient')}</span>
              </>
            ) : (
              <>
                <EyeOff size={14} className="text-warning" />
                <span className="text-warning">{t('tickets.internalTicket')}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* CC Emails */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t('tickets.ccEmails')}
        </h4>
        {isFinished ? (
          ticket.ccEmails.length > 0 ? (
            <div className="space-y-1">
              {ticket.ccEmails.map((email) => (
                <p key={email} className="text-xs text-text-secondary">{email}</p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">{t('common.none')}</p>
          )
        ) : (
          <CcEmailsInput
            value={ticket.ccEmails}
            onChange={onCcEmailsChange}
          />
        )}
      </div>

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
