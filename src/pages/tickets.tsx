import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { PaginationControls } from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import { TicketStatusBadge } from '../components/tickets/ticket-status-badge';
import { TicketPriorityBadge } from '../components/tickets/ticket-priority-badge';
import { TicketTypeBadge } from '../components/tickets/ticket-type-badge';
import { TicketFilters, type TicketFilterValues } from '../components/tickets/ticket-filters';
import { TicketKanban } from '../components/tickets/ticket-kanban';
import { ticketService } from '../services/ticket.service';
import { listProjects } from '../services/project.service';
import { formatApiError } from '../services/api';
import { usePagination } from '../hooks/use-pagination';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import type { Ticket } from '../types/ticket.types';

type ViewMode = 'list' | 'kanban';

const VIEW_MODE_KEY = 'cloupone_tickets_view_mode';

function getInitialViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === 'kanban' || saved === 'list') return saved;
  } catch { /* ignore */ }
  return 'list';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const NOT_FINISHED_STATUSES = 'open,in_analysis,awaiting_customer,awaiting_third_party';

const emptyFilters: TicketFilterValues = {
  projectId: '',
  status: 'active',
  type: '',
  priority: '',
  search: '',
};

function resolveStatusParam(status: string): string | undefined {
  if (status === 'active') return NOT_FINISHED_STATUSES;
  if (status === 'all') return undefined;
  return status || undefined;
}

export default function TicketsPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<TicketFilterValues>(emptyFilters);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const { page, limit, meta, setMeta, goToPage, resetPage } = usePagination({ initialLimit: 20 });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await ticketService.list({
        page,
        limit,
        projectId: filters.projectId || undefined,
        status: resolveStatusParam(filters.status),
        type: (filters.type as Ticket['type']) || undefined,
        priority: (filters.priority as Ticket['priority']) || undefined,
        search: filters.search || undefined,
        sort: 'updated_at',
        order: 'desc',
      });
      setTickets(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, setMeta]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await listProjects({ limit: 100, status: 'active' });
        setProjects(result.data.map((p) => ({ id: p.id, name: p.name })));
      } catch (err) { console.error(err); }
    }
    loadProjects();
  }, []);

  function handleFiltersChange(newFilters: TicketFilterValues) {
    setFilters(newFilters);
    resetPage();
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch { /* ignore */ }
  }

  function handleTicketUpdated() {
    loadTickets();
  }

  const isInternalUser = user?.role !== 'user';
  const effectiveViewMode: ViewMode = isInternalUser ? viewMode : 'list';

  return (
    <SidebarLayout navItems={navItems} title="Atendimento">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Atendimento</h2>
          <p className="text-sm text-text-muted mt-1">
            {meta ? `${meta.total} ticket${meta.total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {isInternalUser && (
            <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${viewMode === 'list' ? 'bg-surface-3 text-text-primary font-medium' : 'text-text-muted hover:text-text-secondary'}`}
                title="Visualizar como lista"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('kanban')}
                className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${viewMode === 'kanban' ? 'bg-surface-3 text-text-primary font-medium' : 'text-text-muted hover:text-text-secondary'}`}
                title="Visualizar como kanban"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          )}
          <Button onClick={() => navigate('/tickets/new')}>
            <Plus size={16} className="mr-2" /> Novo Ticket
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <TicketFilters values={filters} onChange={handleFiltersChange} projects={projects} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {effectiveViewMode === 'list' ? (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
              <List size={40} className="text-text-muted mb-3" />
              <p className="text-text-secondary font-medium">Nenhum ticket encontrado</p>
              <p className="text-sm text-text-muted mt-1">Crie um novo ticket para comecar</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Codigo</TableHeader>
                    <TableHeader>Titulo</TableHeader>
                    <TableHeader>Tipo</TableHeader>
                    <TableHeader>Prioridade</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Atribuido</TableHeader>
                    <TableHeader>Projeto</TableHeader>
                    <TableHeader>Atualizado</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-mono text-xs font-medium text-accent">{ticket.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary truncate max-w-xs">{ticket.title}</span>
                          {isInternalUser && !ticket.isVisibleToClient && (
                            <span className="shrink-0 inline-flex items-center rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-text-muted border border-border">
                              Interno
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><TicketTypeBadge type={ticket.type} /></TableCell>
                      <TableCell><TicketPriorityBadge priority={ticket.priority} /></TableCell>
                      <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                      <TableCell className="text-sm">{ticket.assignedToName || <span className="text-text-muted">—</span>}</TableCell>
                      <TableCell className="text-sm">{ticket.projectName}</TableCell>
                      <TableCell className="text-xs text-text-muted">{formatDate(ticket.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {meta && <PaginationControls meta={meta} onPageChange={goToPage} />}
            </>
          )}
        </>
      ) : (
        <TicketKanban
          filters={filters}
          projects={projects}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
    </SidebarLayout>
  );
}
