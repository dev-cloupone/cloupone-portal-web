import { ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { TICKET_PRIORITY_LABELS, type TicketPriority } from '../../types/ticket.types';

const priorityConfig: Record<TicketPriority, { variant: 'default' | 'success' | 'warning' | 'danger'; icon: React.ReactNode }> = {
  low: { variant: 'default', icon: <ArrowDown size={12} /> },
  medium: { variant: 'default', icon: <Minus size={12} /> },
  high: { variant: 'warning', icon: <ArrowUp size={12} /> },
  critical: { variant: 'danger', icon: <AlertTriangle size={12} /> },
};

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function TicketPriorityBadge({ priority, className = '' }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant={config.variant} className={className}>
      <span className="mr-1 inline-flex">{config.icon}</span>
      {TICKET_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
