import { Bug, Sparkles, Lightbulb } from 'lucide-react';
import { Badge } from '../ui/badge';
import { TICKET_TYPE_LABELS, type TicketType } from '../../types/ticket.types';

const typeConfig: Record<TicketType, { variant: 'default' | 'success' | 'warning' | 'danger'; icon: React.ReactNode; className?: string }> = {
  bug: { variant: 'danger', icon: <Bug size={12} /> },
  improvement: { variant: 'default', icon: <Sparkles size={12} />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  initiative: { variant: 'success', icon: <Lightbulb size={12} /> },
};

interface TicketTypeBadgeProps {
  type: TicketType;
  className?: string;
}

export function TicketTypeBadge({ type, className = '' }: TicketTypeBadgeProps) {
  const config = typeConfig[type];
  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className}`}>
      <span className="mr-1 inline-flex">{config.icon}</span>
      {TICKET_TYPE_LABELS[type]}
    </Badge>
  );
}
