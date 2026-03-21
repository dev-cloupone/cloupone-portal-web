import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCheck, Clock, User } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { WeekDetail } from '../components/approvals/week-detail';
import * as timeEntryService from '../services/time-entry.service';
import * as consultantService from '../services/consultant.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { TimeEntry } from '../types/time-entry.types';

type PendingEntry = TimeEntry & { userName?: string; userEmail?: string };

interface PendingWeekGroup {
  key: string;
  userId: string;
  userName: string;
  userEmail: string;
  weekStart: string;
  weekEnd: string;
  entries: PendingEntry[];
  totalHours: number;
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

function groupByWeek(entries: PendingEntry[]): PendingWeekGroup[] {
  const groups = new Map<string, PendingWeekGroup>();

  for (const entry of entries) {
    const monday = getMonday(entry.date);
    const key = `${entry.userId}-${monday}`;

    if (!groups.has(key)) {
      const mondayDate = new Date(monday + 'T00:00:00');
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);

      groups.set(key, {
        key,
        userId: entry.userId,
        userName: entry.userName || 'Consultor',
        userEmail: entry.userEmail || '',
        weekStart: monday,
        weekEnd: sundayDate.toISOString().split('T')[0],
        entries: [],
        totalHours: 0,
      });
    }

    const group = groups.get(key)!;
    group.entries.push(entry);
    group.totalHours += Number(entry.hours);
  }

  return Array.from(groups.values()).sort((a, b) => {
    const weekComp = a.weekStart.localeCompare(b.weekStart);
    if (weekComp !== 0) return weekComp;
    return a.userName.localeCompare(b.userName);
  });
}

export default function ApprovalsPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const [groups, setGroups] = useState<PendingWeekGroup[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>(
    [],
  );

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const result = await timeEntryService.listPending({
        page: 1,
        limit: 100,
        consultantId: filterConsultant || undefined,
      });
      const grouped = groupByWeek(result.data);
      setGroups(grouped);
      // Clean up expanded/selected for groups that no longer exist
      const validKeys = new Set(grouped.map((g) => g.key));
      setExpanded((prev) => new Set([...prev].filter((k) => validKeys.has(k))));
      setSelected((prev) => new Set([...prev].filter((k) => validKeys.has(k))));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadConsultants() {
    try {
      const result = await consultantService.listConsultants({ page: 1, limit: 100 });
      setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName })));
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    loadData();
  }, [filterConsultant]);

  useEffect(() => {
    loadConsultants();
  }, []);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === groups.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(groups.map((g) => g.key)));
    }
  }

  async function handleBatchApprove() {
    const entryIds = groups
      .filter((g) => selected.has(g.key))
      .flatMap((g) => g.entries.map((e) => e.id));
    if (entryIds.length === 0) return;
    try {
      await timeEntryService.approveEntries(entryIds);
      addToast(`${entryIds.length} apontamento(s) aprovado(s) com sucesso.`, 'success');
      setSelected(new Set());
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleApproveGroup(entryIds: string[]) {
    await timeEntryService.approveEntries(entryIds);
    addToast(`${entryIds.length} apontamento(s) aprovado(s).`, 'success');
    await loadData();
  }

  async function handleRejectEntry(entryId: string, comment: string) {
    await timeEntryService.rejectEntry(entryId, comment);
    addToast('Apontamento rejeitado.', 'warning');
    await loadData();
  }

  const totalPending = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <SidebarLayout navItems={navItems} title="Aprovacoes">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Aprovacoes</h2>
          <p className="text-sm text-text-muted mt-1">
            {totalPending} apontamento{totalPending !== 1 ? 's' : ''} pendente
            {totalPending !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="w-56">
            <Select
              label="Filtrar consultor"
              options={[
                { value: '', label: 'Todos os consultores' },
                ...consultantOptions,
              ]}
              value={filterConsultant}
              onChange={setFilterConsultant}
            />
          </div>
          {selected.size > 0 && (
            <Button onClick={handleBatchApprove} size="sm">
              <CheckCheck size={15} className="mr-1.5" />
              Aprovar {selected.size} semana{selected.size !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <CheckCheck size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Nenhuma aprovacao pendente</p>
          <p className="text-text-muted text-sm mt-1">
            Todos os apontamentos foram processados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.length > 1 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selected.size === groups.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
              />
              <span className="text-xs text-text-muted">Selecionar tudo</span>
            </div>
          )}

          {groups.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-border bg-surface-1 overflow-hidden"
            >
              {/* Group header */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface-2/50 transition-colors"
                onClick={() => toggleExpanded(group.key)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(group.key)}
                  onChange={() => toggleSelected(group.key)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                />
                <button className="text-text-muted" type="button">
                  {expanded.has(group.key) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-text-muted shrink-0" />
                    <span className="font-semibold text-sm text-text-primary truncate">
                      {group.userName}
                    </span>
                    <span className="text-xs text-text-muted hidden sm:inline">
                      {group.userEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-text-muted shrink-0" />
                    <span className="text-xs text-text-secondary">
                      {formatWeekRange(group.weekStart, group.weekEnd)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="warning">{group.totalHours.toFixed(1)}h</Badge>
                  <span className="text-xs text-text-muted">
                    {group.entries.length} item{group.entries.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded.has(group.key) && (
                <div className="border-t border-border px-4 py-3 bg-surface-0/50">
                  <WeekDetail
                    entries={group.entries}
                    onApproveAll={handleApproveGroup}
                    onReject={handleRejectEntry}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
