import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import type { ExpenseWeekSummary, Expense } from '../../types/expense.types';

interface ExpenseSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  weekSummary: ExpenseWeekSummary | null;
  draftExpenses: Expense[];
  isSubmitting: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

export function ExpenseSubmitDialog({
  isOpen,
  onClose,
  onConfirm,
  weekSummary,
  draftExpenses,
  isSubmitting,
}: ExpenseSubmitDialogProps) {
  if (!weekSummary) return null;

  const totalAmount = draftExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Preview: which will be auto-approved vs pending
  const autoApproveList: Expense[] = [];
  const pendingList: { expense: Expense; reason: string }[] = [];

  for (const expense of draftExpenses) {
    if (expense.categoryMaxAmount) {
      const withinBudget = Number(expense.amount) <= Number(expense.categoryMaxAmount);
      const hasReceipt = !!expense.receiptFileId || !expense.categoryRequiresReceipt;
      if (withinBudget && hasReceipt) {
        autoApproveList.push(expense);
        continue;
      }
      if (!withinBudget) {
        pendingList.push({ expense, reason: `Acima do teto (${formatCurrency(Number(expense.categoryMaxAmount))})` });
        continue;
      }
      if (!hasReceipt) {
        pendingList.push({ expense, reason: 'Comprovante obrigatório ausente' });
        continue;
      }
    }

    if (!expense.expenseCategoryId) {
      pendingList.push({ expense, reason: 'Sem categoria definida' });
    } else if (!expense.categoryMaxAmount) {
      pendingList.push({ expense, reason: 'Categoria sem teto definido' });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submeter Semana">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Periodo: <strong>{formatWeekRange(weekSummary.weekStart, weekSummary.weekEnd)}</strong>
        </p>
        <p className="text-sm text-text-secondary">
          Voce esta prestes a submeter <strong>{draftExpenses.length}</strong> despesa(s) totalizando{' '}
          <strong>{formatCurrency(totalAmount)}</strong>.
        </p>

        {/* Auto-approval preview */}
        {autoApproveList.length > 0 && (
          <div className="rounded-lg bg-success/5 border border-success/20 px-3 py-2 space-y-1">
            <p className="text-xs font-semibold text-success">
              {autoApproveList.length} sera(ao) auto-aprovada(s)
            </p>
            <p className="text-xs text-text-muted">
              Dentro do teto da categoria e com comprovante (quando exigido).
            </p>
          </div>
        )}

        {/* Pending approval preview */}
        {pendingList.length > 0 && (
          <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-warning">
              {pendingList.length} ira(ao) para aprovacao manual
            </p>
            <div className="space-y-1">
              {pendingList.map(({ expense, reason }) => (
                <div key={expense.id} className="text-xs text-text-secondary flex justify-between">
                  <span className="truncate">{expense.categoryName || 'Sem categoria'} — {formatCurrency(Number(expense.amount))}</span>
                  <span className="text-text-muted shrink-0 ml-2">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-text-muted">
          Apos a submissao, as despesas nao poderao ser editadas ate que o gestor as aprove ou rejeite.
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Voltar e corrigir
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submetendo...' : 'Submeter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
