import { useTranslation } from 'react-i18next';
import { Calendar, BarChart3 } from 'lucide-react';
import type { ExpenseMonthData, ExpenseWeekSummary } from '../../types/expense.types';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

interface ExpenseMonthSummaryProps {
  monthData: ExpenseMonthData;
  weekSummaries: ExpenseWeekSummary[];
}

const STATUS_LABEL_KEYS: Record<string, { key: string; color: string }> = {
  created: { key: 'expenses.statusCreated', color: 'bg-accent' },
  draft: { key: 'expenses.statusDraft', color: 'bg-text-muted' },
  submitted: { key: 'expenses.statusSubmitted', color: 'bg-warning' },
  approved: { key: 'expenses.statusApproved', color: 'bg-success' },
  rejected: { key: 'expenses.statusRejected', color: 'bg-danger' },
};

export function ExpenseMonthSummary({ monthData, weekSummaries }: ExpenseMonthSummaryProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const expenses = monthData.expenses;
  const expenseCount = expenses.length;

  // Breakdown by project
  const projectMap = new Map<string, { name: string; amount: number }>();
  for (const e of expenses) {
    const existing = projectMap.get(e.projectId) ?? { name: e.projectName, amount: 0 };
    existing.amount += Number(e.amount);
    projectMap.set(e.projectId, existing);
  }
  const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.amount - a.amount);

  // Breakdown by category
  const categoryMap = new Map<string, { name: string; amount: number }>();
  for (const e of expenses) {
    const catKey = e.expenseCategoryId ?? '__none';
    const catName = e.categoryName ?? t('expenses.noCategory');
    const existing = categoryMap.get(catKey) ?? { name: catName, amount: 0 };
    existing.amount += Number(e.amount);
    categoryMap.set(catKey, existing);
  }
  const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

  // Breakdown by status
  const statusCounts: Record<string, number> = {};
  for (const e of expenses) {
    statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-5 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('expenses.monthTotal')} value={formatCurrency(monthData.totalAmount)} />
        <StatCard label={t('expenses.expensesLabel')} value={String(expenseCount)} />
      </div>

      {/* Project breakdown */}
      {projectBreakdown.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <BarChart3 size={12} /> {t('expenses.byProject')}
          </div>
          <div className="space-y-1.5">
            {projectBreakdown.map(p => {
              const pct = monthData.totalAmount > 0 ? (p.amount / monthData.totalAmount) * 100 : 0;
              return (
                <div key={p.name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary truncate">{p.name}</span>
                    <span className="text-text-tertiary shrink-0 ml-2">{formatCurrency(p.amount)} ({Math.round(pct)}%)</span>
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

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('expenses.byCategory')}
          </div>
          <div className="space-y-1">
            {categoryBreakdown.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{c.name}</span>
                <span className="text-text-tertiary">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('expenses.byStatus')}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = STATUS_LABEL_KEYS[status];
              if (!cfg) return null;
              return (
                <span key={status} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  {t(cfg.key)}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Week breakdown */}
      {weekSummaries.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('expenses.byWeek')}
          </div>
          <div className="space-y-1">
            {weekSummaries.map(w => {
              const weekLabel = new Date(w.weekStart + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
              const statusCfg = STATUS_LABEL_KEYS[w.status] ?? STATUS_LABEL_KEYS.draft;
              return (
                <div key={w.weekStart} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.color}`} />
                    {t('expenses.weekAbbr')} {weekLabel}
                  </span>
                  <span className="text-text-tertiary">{formatCurrency(w.totalAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border">
        <Calendar size={14} />
        <span>{t('expenses.calendarHint')}</span>
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
