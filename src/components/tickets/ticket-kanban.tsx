import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TicketCard } from './ticket-card';
import { Skeleton } from '../ui/skeleton';
import { ticketService } from '../../services/ticket.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import {
  TICKET_STATUS_LABELS,
  type Ticket,
  type TicketStatus,
} from '../../types/ticket.types';
import type { TicketFilterValues } from './ticket-filters';

const ALL_STATUSES = ['open', 'in_analysis', 'awaiting_customer', 'awaiting_third_party', 'finished'];

const STATUS_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  ALL_STATUSES.map((s) => [s, ALL_STATUSES.filter((t) => t !== s)])
);

const KANBAN_COLUMNS: TicketStatus[] = [
  'open',
  'in_analysis',
  'awaiting_customer',
  'awaiting_third_party',
  'finished',
];

interface TicketKanbanProps {
  filters: TicketFilterValues;
  projects: { id: string; name: string }[];
  onTicketUpdated: () => void;
}

export function TicketKanban({ filters, onTicketUpdated }: TicketKanbanProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ticketService.list({
        limit: 100,
        projectId: filters.projectId || undefined,
        status: filters.status && filters.status !== 'active' && filters.status !== 'all' ? filters.status : undefined,
        type: (filters.type as Ticket['type']) || undefined,
        priority: (filters.priority as Ticket['priority']) || undefined,
        search: filters.search || undefined,
        sort: 'updated_at',
        order: 'desc',
      });
      setTickets(result.data);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const ticketsByStatus = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    for (const col of KANBAN_COLUMNS) {
      map[col] = [];
    }
    for (const ticket of tickets) {
      if (map[ticket.status]) {
        map[ticket.status].push(ticket);
      }
    }
    return map;
  }, [tickets]);

  function handleDragStart(event: DragStartEvent) {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket) return;

    // Determine target column
    let targetStatus: string | null = null;

    // If dropped over a column droppable
    if (KANBAN_COLUMNS.includes(over.id as TicketStatus)) {
      targetStatus = over.id as string;
    } else {
      // Dropped over another ticket — find its status
      const overTicket = tickets.find((t) => t.id === over.id);
      if (overTicket) {
        targetStatus = overTicket.status;
      }
    }

    if (!targetStatus || targetStatus === ticket.status) return;

    // Validate transition
    const allowed = STATUS_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(targetStatus)) {
      addToast(
        `Transicao invalida: ${TICKET_STATUS_LABELS[ticket.status as TicketStatus]} → ${TICKET_STATUS_LABELS[targetStatus as TicketStatus]}`,
        'error'
      );
      return;
    }

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: targetStatus as TicketStatus } : t))
    );

    try {
      await ticketService.update(ticket.id, { status: targetStatus as TicketStatus });
      onTicketUpdated();
    } catch (err) {
      // Revert on error
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: ticket.status } : t))
      );
      addToast(formatApiError(err), 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const columnTickets = ticketsByStatus[status] || [];
          return (
            <KanbanColumn
              key={status}
              status={status}
              tickets={columnTickets}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTicket && <TicketCard ticket={activeTicket} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
}

function KanbanColumn({ status, tickets }: KanbanColumnProps) {
  const ticketIds = useMemo(() => tickets.map((t) => t.id), [tickets]);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="w-72 shrink-0">
      <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 mb-3 border border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {TICKET_STATUS_LABELS[status]}
        </span>
        <span className="text-[11px] font-medium text-text-muted bg-surface-3 rounded-full px-2 py-0.5">
          {tickets.length}
        </span>
      </div>

      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy} id={status}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[100px] rounded-lg p-2 border transition-colors ${
            isOver
              ? 'bg-accent/5 border-accent/30'
              : 'bg-surface-0/50 border-transparent'
          }`}
        >
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
          {tickets.length === 0 && (
            <div className="flex items-center justify-center py-8 text-xs text-text-muted">
              Vazio
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
