import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router';
import { Calendar, User as UserIcon } from 'lucide-react';
import { TicketTypeBadge } from './ticket-type-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';
import type { Ticket } from '../../types/ticket.types';

interface TicketCardProps {
  ticket: Ticket;
  isDragging?: boolean;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isNearDue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
}

export function TicketCard({ ticket, isDragging }: TicketCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: ticket.id, data: { ticket } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className={`rounded-lg border bg-surface-1 p-3 cursor-pointer transition-all ${
        dragging
          ? 'opacity-50 shadow-lg border-accent/50 rotate-1'
          : 'border-border hover:shadow-md hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-medium text-accent">{ticket.code}</span>
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <p className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{ticket.title}</p>

      <div className="flex items-center justify-between">
        <TicketTypeBadge type={ticket.type} />
        <div className="flex items-center gap-2">
          {ticket.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] ${
                isOverdue(ticket.dueDate)
                  ? 'text-danger'
                  : isNearDue(ticket.dueDate)
                  ? 'text-warning'
                  : 'text-text-muted'
              }`}
              title={`Prazo: ${new Date(ticket.dueDate).toLocaleDateString('pt-BR')}`}
            >
              <Calendar size={10} />
            </div>
          )}
          {ticket.assignedToName ? (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent text-[10px] font-bold"
              title={ticket.assignedToName}
            >
              {ticket.assignedToName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-text-muted"
              title="Sem atribuicao"
            >
              <UserIcon size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
