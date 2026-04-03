import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { MonthData, WeekSummary } from '../../types/time-entry.types';
import type { MonthlyTimesheetStatus } from '../../types/monthly-timesheet.types';

interface MonthHeaderProps {
  currentMonth: string;
  monthData: MonthData | null;
  monthStatus?: MonthlyTimesheetStatus | null;
  selectedWeekSummary: WeekSummary | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onApproveMonth?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { label: 'Aberto', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  reopened: { label: 'Reaberto', variant: 'default' },
};

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function ProgressBar({ label, current, target }: { label: string; current: number; target: number }) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const barColor = percent >= 100
    ? 'bg-success'
    : percent >= 75
      ? 'bg-accent'
      : percent >= 50
        ? 'bg-warning'
        : 'bg-text-muted';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{label}: {current.toFixed(1)}h / {target}h</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function MonthHeader({
  currentMonth,
  monthData,
  monthStatus,
  selectedWeekSummary,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onApproveMonth,
}: MonthHeaderProps) {
  const statusCfg = monthStatus ? STATUS_CONFIG[monthStatus] : null;
  const canApprove = monthStatus === 'open' || monthStatus === 'reopened';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Apontamento de Horas
          </h2>
          {statusCfg && <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {canApprove && onApproveMonth && (
            <Button size="sm" onClick={onApproveMonth}>
              <CheckCircle size={14} className="mr-1" /> Aprovar mes
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label="Mes anterior">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Proximo mes">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> Hoje
          </Button>
        </div>
      </div>

      {monthData && (
        <div className="space-y-2">
          <ProgressBar
            label="Mes"
            current={monthData.totalHours}
            target={monthData.targetHours}
          />
          {selectedWeekSummary && (
            <ProgressBar
              label="Semana"
              current={selectedWeekSummary.totalHours}
              target={selectedWeekSummary.targetHours}
            />
          )}
        </div>
      )}
    </div>
  );
}
