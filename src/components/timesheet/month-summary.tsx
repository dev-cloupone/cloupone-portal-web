import { Calendar, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';
import type { MonthData, WeekSummary } from '../../types/time-entry.types';
import type { MonthlyTimesheetStatus } from '../../types/monthly-timesheet.types';
import { useLocaleStore } from '../../stores/locale.store';

interface MonthSummaryProps {
  monthData: MonthData;
  weekSummaries: WeekSummary[];
  monthStatus?: MonthlyTimesheetStatus | null;
}

const STATUS_KEYS: Record<string, { key: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { key: 'timesheet.statusOpen', variant: 'warning' },
  approved: { key: 'timesheet.statusApproved', variant: 'success' },
  reopened: { key: 'timesheet.statusReopened', variant: 'default' },
};

export function MonthSummary({ monthData, weekSummaries, monthStatus }: MonthSummaryProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const entries = monthData.entries;

  // Days worked
  const uniqueDays = new Set(entries.map(e => e.date));
  const daysWorked = uniqueDays.size;
  // Breakdown by project
  const projectMap = new Map<string, { name: string; hours: number }>();
  for (const e of entries) {
    const existing = projectMap.get(e.projectId) ?? { name: e.projectName, hours: 0 };
    existing.hours += Number(e.hours);
    projectMap.set(e.projectId, existing);
  }
  const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.hours - a.hours);

  const statusCfg = monthStatus ? STATUS_KEYS[monthStatus] : null;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-5 animate-fade-in">
      {/* Month status badge */}
      {statusCfg && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t('timesheet.monthStatus')}</span>
          <Badge variant={statusCfg.variant}>{t(statusCfg.key)}</Badge>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('timesheet.totalRecorded')} value={`${monthData.totalHours.toFixed(1)}h`} />
        <StatCard label={t('timesheet.daysWorked')} value={String(daysWorked)} />
      </div>

      {/* Project breakdown */}
      {projectBreakdown.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <BarChart3 size={12} /> {t('timesheet.byProject')}
          </div>
          <div className="space-y-1.5">
            {projectBreakdown.map(p => {
              const pct = monthData.totalHours > 0 ? (p.hours / monthData.totalHours) * 100 : 0;
              return (
                <div key={p.name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary truncate">{p.name}</span>
                    <span className="text-text-tertiary shrink-0 ml-2">{p.hours.toFixed(1)}h ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week breakdown */}
      {weekSummaries.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('timesheet.byWeek')}
          </div>
          <div className="space-y-1">
            {weekSummaries.map(w => {
              const weekLabel = new Date(w.weekStartDate + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
              return (
                <div key={w.weekStartDate} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    {t('timesheet.weekLabel', { date: weekLabel })}
                  </span>
                  <span className="text-text-tertiary">{w.totalHours.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
        <Calendar size={14} />
        <span>{t('timesheet.selectDayHint')}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 border border-border p-3">
      <p className="text-caption text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-text-primary mt-0.5">{value}</p>
    </div>
  );
}
