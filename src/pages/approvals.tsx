import { useState, useEffect } from 'react';
import { CheckCheck, User, Calendar, Eye, RotateCcw, AlertTriangle } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { MonthDetail } from '../components/approvals/month-detail';
import { ReopenMonthModal } from '../components/approvals/reopen-month-modal';
import { useMonthlyApprovals } from '../hooks/use-monthly-approvals';
import { useNavItems } from '../hooks/use-nav-items';
import * as consultantService from '../services/consultant.service';
import type { MonthlyTimesheet } from '../types/monthly-timesheet.types';

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { label: 'Aberto', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  reopened: { label: 'Reaberto', variant: 'default' },
};

export default function ApprovalsPage() {
  const navItems = useNavItems();
  const {
    timesheets, isLoading, error, filters, pendingCount,
    detail, detailLoading,
    updateFilters, loadDetail, closeDetail,
    approveMonth, reopenMonth,
  } = useMonthlyApprovals();

  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);
  const [reopenTarget, setReopenTarget] = useState<MonthlyTimesheet | null>(null);

  useEffect(() => {
    consultantService.listConsultants({ page: 1, limit: 100 })
      .then((result) => setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName }))))
      .catch(() => {});
  }, []);

  function handleApprove(ts: MonthlyTimesheet) {
    approveMonth(ts.userId, ts.year, ts.month);
  }

  function handleOpenReopen(ts: MonthlyTimesheet) {
    setReopenTarget(ts);
  }

  async function handleConfirmReopen(reason: string) {
    if (!reopenTarget) return;
    await reopenMonth(reopenTarget.userId, reopenTarget.year, reopenTarget.month, reason);
    setReopenTarget(null);
  }

  function handleViewDetail(ts: MonthlyTimesheet) {
    loadDetail(ts.userId, ts.year, ts.month);
  }

  // If viewing detail, show month-detail view
  if (detail) {
    return (
      <SidebarLayout navItems={navItems} title="Aprovações">
        <MonthDetail
          timesheet={detail.timesheet}
          entries={detail.entries}
          isLoading={detailLoading}
          onBack={closeDetail}
          onApprove={() => approveMonth(detail.timesheet.userId, detail.timesheet.year, detail.timesheet.month)}
          onReopen={() => setReopenTarget(detail.timesheet)}
        />

        <ReopenMonthModal
          isOpen={!!reopenTarget}
          onClose={() => setReopenTarget(null)}
          onConfirm={handleConfirmReopen}
          monthLabel={reopenTarget ? `${MONTH_NAMES[reopenTarget.month]}/${reopenTarget.year}` : ''}
        />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} title="Aprovações">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Aprovações Mensais</h2>
          <p className="text-sm text-text-muted mt-1">
            {pendingCount} mes{pendingCount !== 1 ? 'es' : ''} pendente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="w-48">
            <Select
              label="Status"
              options={[
                { value: '', label: 'Todos' },
                { value: 'open', label: 'Aberto' },
                { value: 'approved', label: 'Aprovado' },
                { value: 'reopened', label: 'Reaberto' },
              ]}
              value={filters.status ?? ''}
              onChange={(v) => updateFilters({ status: v || undefined })}
            />
          </div>
          <div className="w-56">
            <Select
              label="Consultor"
              options={[
                { value: '', label: 'Todos os consultores' },
                ...consultantOptions,
              ]}
              value={filters.userId ?? ''}
              onChange={(v) => updateFilters({ userId: v || undefined })}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : timesheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <CheckCheck size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Nenhum registro encontrado</p>
          <p className="text-text-muted text-sm mt-1">
            Ajuste os filtros ou aguarde novos apontamentos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {timesheets.map((ts) => {
            const statusCfg = STATUS_LABELS[ts.status] ?? STATUS_LABELS.open;
            const canApprove = ts.status === 'open' || ts.status === 'reopened';
            const canReopen = ts.status === 'approved';

            return (
              <div
                key={ts.id}
                className={`rounded-xl border bg-surface-1 px-4 py-3.5 flex items-center gap-4 ${
                  ts.escalatedAt ? 'border-warning/40' : 'border-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-text-muted shrink-0" />
                    <span className="font-semibold text-sm text-text-primary truncate">
                      {ts.consultantName ?? 'Consultor'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar size={12} className="text-text-muted shrink-0" />
                    <span className="text-xs text-text-secondary">
                      {MONTH_NAMES[ts.month]}/{ts.year}
                    </span>
                    {ts.escalatedAt && (
                      <Badge variant="warning">
                        <AlertTriangle size={10} className="mr-0.5" /> Escalonado
                      </Badge>
                    )}
                    {ts.status === 'reopened' && (
                      <span className="flex items-center gap-0.5 text-xs text-text-muted">
                        <RotateCcw size={10} />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-text-primary">
                    {Number(ts.totalHours ?? 0).toFixed(1)}h
                  </span>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleViewDetail(ts)}>
                    <Eye size={14} className="mr-1" /> Detalhes
                  </Button>
                  {canApprove && (
                    <Button size="sm" onClick={() => handleApprove(ts)}>
                      Aprovar
                    </Button>
                  )}
                  {canReopen && (
                    <Button size="sm" variant="ghost" onClick={() => handleOpenReopen(ts)}>
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reopen modal */}
      <ReopenMonthModal
        isOpen={!!reopenTarget}
        onClose={() => setReopenTarget(null)}
        onConfirm={handleConfirmReopen}
        monthLabel={reopenTarget ? `${MONTH_NAMES[reopenTarget.month]}/${reopenTarget.year}` : ''}
      />
    </SidebarLayout>
  );
}
