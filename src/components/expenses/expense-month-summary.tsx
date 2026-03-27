import { Calendar, BarChart3 } from 'lucide-react';
import type { ExpenseMonthData, ExpenseWeekSummary } from '../../types/expense.types';

interface ExpenseMonthSummaryProps {
  monthData: ExpenseMonthData;
  weekSummaries: ExpenseWeekSummary[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-text-muted' },
  submitted: { label: 'Submetido', color: 'bg-warning' },
  approved: { label: 'Aprovado', color: 'bg-success' },
  rejected: { label: 'Rejeitado', color: 'bg-danger' },
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseMonthSummary({ monthData, weekSummaries }: ExpenseMonthSummaryProps) {
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
    const catName = e.categoryName ?? 'Sem categoria';
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
        <StatCard label="Total do mês" value={formatCurrency(monthData.totalAmount)} />
        <StatCard label="Despesas" value={String(expenseCount)} />
      </div>

      {/* Project breakdown */}
      {projectBreakdown.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <BarChart3 size={12} /> Por Projeto
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
            Por Categoria
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
            Por Status
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = STATUS_LABELS[status];
              if (!cfg) return null;
              return (
                <span key={status} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  {cfg.label}: {count}
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
            Por Semana
          </div>
          <div className="space-y-1">
            {weekSummaries.map(w => {
              const weekLabel = new Date(w.weekStart + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const statusCfg = STATUS_LABELS[w.status] ?? STATUS_LABELS.draft;
              return (
                <div key={w.weekStart} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.color}`} />
                    Sem. {weekLabel}
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
        <span>Selecione um dia no calendário para ver detalhes</span>
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
