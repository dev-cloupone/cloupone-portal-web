import { Badge } from '../ui/badge';
import { TICKET_STATUS_LABELS, type TicketStatus } from '../../types/ticket.types';

const statusConfig: Record<TicketStatus, { variant: 'default' | 'success' | 'warning' | 'danger'; className?: string }> = {
  open: { variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_analysis: { variant: 'warning' },
  in_progress: { variant: 'default', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  in_review: { variant: 'default', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  resolved: { variant: 'success' },
  closed: { variant: 'default' },
  reopened: { variant: 'warning', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  cancelled: { variant: 'danger' },
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className = '' }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className}`}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
