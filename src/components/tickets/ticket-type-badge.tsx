import { AlertTriangle, HelpCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/badge';
import { TICKET_TYPE_LABELS, type TicketType } from '../../types/ticket.types';

const typeConfig: Record<TicketType, { variant: 'default' | 'success' | 'warning' | 'danger'; icon: React.ReactNode; className?: string }> = {
  system_error: { variant: 'danger', icon: <AlertTriangle size={12} /> },
  question: { variant: 'default', icon: <HelpCircle size={12} />, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  improvement: { variant: 'default', icon: <Sparkles size={12} />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  security: { variant: 'default', icon: <ShieldAlert size={12} />, className: 'bg-purple-100 text-purple-700 border-purple-200' },
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
