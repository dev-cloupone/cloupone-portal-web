import { Plus, Send, Receipt, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ExpenseCard } from './expense-card';
import type { Expense, ExpenseWeekSummary } from '../../types/expense.types';

interface ExpenseDayPanelProps {
  selectedDate: string;
  expenses: Expense[];
  weekSummary: ExpenseWeekSummary | null;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onResubmit: (expenseId: string) => void;
  onNewExpense: () => void;
  onSubmitWeek: () => void;
  onClose: () => void;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const formatted = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseDayPanel({
  selectedDate,
  expenses,
  weekSummary,
  onEdit,
  onDelete,
  onResubmit,
  onNewExpense,
  onSubmitWeek,
  onClose,
}: ExpenseDayPanelProps) {
  const dayTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const canSubmit = weekSummary?.hasDraftExpenses && weekSummary.status !== 'submitted' && weekSummary.status !== 'approved';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-4 animate-slide-in-right">
      {/* Day header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {formatDayHeader(selectedDate)}
          </h3>
          <div className="flex items-center gap-2">
            {dayTotal > 0 && (
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(dayTotal)}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-0.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              aria-label="Fechar painel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Week info bar */}
        {weekSummary && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              Semana: {formatCurrency(weekSummary.totalAmount)} ({weekSummary.expenseCount} despesa{weekSummary.expenseCount !== 1 ? 's' : ''})
            </span>
            {canSubmit && (
              <Button size="sm" onClick={onSubmitWeek}>
                <Send size={12} className="mr-1" /> Submeter
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Expenses list */}
      {expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
              onResubmit={onResubmit}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt size={32} className="text-text-muted mb-3" />
          <p className="text-sm text-text-tertiary mb-1">Nenhuma despesa</p>
          <p className="text-xs text-text-muted">Clique abaixo para registrar uma despesa</p>
        </div>
      )}

      {/* New expense button */}
      <Button variant="secondary" size="sm" className="w-full" onClick={onNewExpense}>
        <Plus size={14} className="mr-1" /> Nova Despesa
      </Button>
    </div>
  );
}
