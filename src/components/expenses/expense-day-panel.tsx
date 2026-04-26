import { useState } from 'react';
import { Plus, Receipt, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { ExpenseCard } from './expense-card';
import type { Expense, ExpenseWeekSummary } from '../../types/expense.types';

interface ExpenseDayPanelProps {
  selectedDate: string;
  expenses: Expense[];
  weekSummary: ExpenseWeekSummary | null;
  isDayInOpenPeriod: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onResubmit: (expenseId: string) => void;
  onRevertExpense?: (expenseId: string) => Promise<void>;
  onNewExpense: () => void;
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
  isDayInOpenPeriod,
  onEdit,
  onDelete,
  onResubmit,
  onRevertExpense,
  onNewExpense,
  onClose,
}: ExpenseDayPanelProps) {
  const dayTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const [revertingExpense, setRevertingExpense] = useState<Expense | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async () => {
    if (!revertingExpense || !onRevertExpense) return;
    setIsReverting(true);
    try {
      await onRevertExpense(revertingExpense.id);
      setRevertingExpense(null);
    } catch {
      // toast handled in hook
    } finally {
      setIsReverting(false);
    }
  };

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
            {isDayInOpenPeriod && (
              <Button variant="secondary" size="sm" onClick={onNewExpense}>
                <Plus size={14} className="mr-1" /> Nova Despesa
              </Button>
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
          </div>
        )}
      </div>

      {/* Expenses list */}
      {!isDayInOpenPeriod && expenses.length === 0 && (
        <div className="rounded-lg bg-surface-2 border border-border px-3 py-2">
          <p className="text-xs text-text-muted">Nenhum período aberto para esta data. Solicite ao gestor a abertura da semana.</p>
        </div>
      )}

      {expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
              onResubmit={onResubmit}
              onRevert={onRevertExpense ? (e) => setRevertingExpense(e) : undefined}
            />
          ))}
        </div>
      ) : isDayInOpenPeriod ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt size={32} className="text-text-muted mb-3" />
          <p className="text-sm text-text-tertiary mb-1">Nenhuma despesa</p>
          <p className="text-xs text-text-muted">Use o botão acima para registrar uma despesa</p>
        </div>
      ) : null}

      {/* Revert confirmation modal */}
      <Modal
        isOpen={!!revertingExpense}
        onClose={() => setRevertingExpense(null)}
        title="Reverter Despesa"
      >
        <p className="text-sm text-text-secondary mb-4">
          Reverter despesa &ldquo;{revertingExpense?.description || revertingExpense?.categoryName || 'Sem descrição'}&rdquo; de <strong>Aprovada</strong> para <strong>Criada</strong>?
        </p>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setRevertingExpense(null)} disabled={isReverting}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleRevert} disabled={isReverting}>
            {isReverting ? 'Revertendo...' : 'Reverter'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
