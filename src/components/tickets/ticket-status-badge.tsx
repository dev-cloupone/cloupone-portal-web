import { Badge } from '../ui/badge';
import { TICKET_STATUS_LABELS, type TicketStatus } from '../../types/ticket.types';

const statusConfig: Record<TicketStatus, { variant: 'default' | 'success' | 'warning' | 'danger'; className?: string }> = {
  open: { variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_analysis: { variant: 'warning' },
  awaiting_customer: { variant: 'default', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  awaiting_third_party: { variant: 'default', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  finished: { variant: 'success' },
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
