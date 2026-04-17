import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { TicketStatusBadge } from './ticket-status-badge';
import { TICKET_STATUS_LABELS, type TicketStatus } from '../../types/ticket.types';

const ALL_STATUSES: TicketStatus[] = [
  'open',
  'in_analysis',
  'awaiting_customer',
  'awaiting_third_party',
  'finished',
];

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = Object.fromEntries(
  ALL_STATUSES.map((s) => [s, ALL_STATUSES.filter((t) => t !== s)])
) as Record<TicketStatus, TicketStatus[]>;

const STATUS_ROLE_PERMISSIONS: Record<TicketStatus, string[]> = {
  open: ['gestor', 'super_admin'],
  in_analysis: ['consultor', 'gestor', 'super_admin'],
  awaiting_customer: ['consultor', 'gestor', 'super_admin'],
  awaiting_third_party: ['consultor', 'gestor', 'super_admin'],
  finished: ['consultor', 'gestor', 'super_admin'],
};

function canClientTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (to === 'finished' && from !== 'finished') return true;
  if (from === 'awaiting_customer' && to === 'in_analysis') return true;
  return false;
}

function canTransition(from: TicketStatus, to: TicketStatus, role: string): boolean {
  if (role === 'client') return canClientTransition(from, to);
  return STATUS_ROLE_PERMISSIONS[to]?.includes(role) ?? false;
}

function getActionLabel(_from: TicketStatus, to: TicketStatus, role: string): string {
  if (role === 'client' && to === 'finished') return 'Encerrar chamado';
  if (role === 'client' && to === 'in_analysis') return 'Devolver para analise';
  return TICKET_STATUS_LABELS[to];
}

interface TicketStatusButtonProps {
  status: TicketStatus;
  userRole: string;
  onChange: (newStatus: TicketStatus) => Promise<void>;
}

export function TicketStatusButton({ status, userRole, onChange }: TicketStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const allowed = STATUS_TRANSITIONS[status].filter((to) => canTransition(status, to, userRole));

  if (allowed.length === 0) {
    return <TicketStatusBadge status={status} />;
  }

  async function handleSelect(to: TicketStatus) {
    setOpen(false);
    if (to === 'finished') {
      if (!window.confirm('Tem certeza? Apos finalizado, o ticket nao podera mais ser editado.')) {
        return;
      }
    }
    setLoading(true);
    try {
      await onChange(to);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md hover:opacity-80 disabled:opacity-50 transition-opacity"
      >
        <TicketStatusBadge status={status} />
        {loading ? (
          <Loader2 size={14} className="animate-spin text-text-muted" />
        ) : (
          <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 min-w-[200px] rounded-lg border border-border bg-surface-1 p-1 shadow-lg">
          {allowed.map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => handleSelect(to)}
              className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            >
              {getActionLabel(status, to, userRole)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
