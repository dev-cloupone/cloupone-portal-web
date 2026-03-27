import { Pencil, Trash2, AlertTriangle, Paperclip, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import type { Expense } from '../../types/expense.types';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onResubmit?: (expenseId: string) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-text-muted',
  submitted: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-danger',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  submitted: 'Submetido',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseCard({ expense, onEdit, onDelete, onResubmit }: ExpenseCardProps) {
  const canEdit = expense.status === 'draft' || expense.status === 'rejected';
  const canDelete = expense.status === 'draft';
  const canResubmit = expense.status === 'rejected';

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-2 transition-colors hover:border-border-subtle">
      {/* Header: status dot + category + amount */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[expense.status]}`} />
          <span className="text-xs text-text-tertiary">{STATUS_LABELS[expense.status]}</span>
          {expense.autoApproved && expense.status === 'approved' && (
            <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">auto</span>
          )}
        </div>
        <span className="text-sm font-bold text-text-primary">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      {/* Project + Category */}
      <div>
        <p className="text-sm font-medium text-text-primary">{expense.projectName}</p>
        {(expense.clientName || expense.categoryName) && (
          <p className="text-xs text-text-tertiary">
            {[expense.clientName, expense.categoryName].filter(Boolean).join(' \u00b7 ')}
          </p>
        )}
      </div>

      {/* Description */}
      {expense.description && (
        <p className="text-xs text-text-muted line-clamp-2">{expense.description}</p>
      )}

      {/* Receipt indicator */}
      {expense.receiptFileId && (
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Paperclip size={10} />
          <span>Comprovante anexado</span>
        </div>
      )}

      {/* Over budget warning */}
      {expense.categoryMaxAmount && Number(expense.amount) > Number(expense.categoryMaxAmount) && (
        <div className="flex items-center gap-1 text-xs text-warning">
          <AlertTriangle size={10} />
          <span>Acima do teto ({formatCurrency(expense.categoryMaxAmount)})</span>
        </div>
      )}

      {/* Rejection comment */}
      {expense.status === 'rejected' && expense.rejectionComment && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-danger" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-danger">Motivo da rejeicao</span>
          </div>
          <p className="text-xs text-text-primary">{expense.rejectionComment}</p>
        </div>
      )}

      {/* Actions */}
      {(canEdit || canDelete || canResubmit) && (
        <div className="flex items-center gap-2 pt-1">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>
              <Pencil size={12} className="mr-1" /> Editar
            </Button>
          )}
          {canResubmit && onResubmit && (
            <Button variant="ghost" size="sm" onClick={() => onResubmit(expense.id)}>
              <RotateCcw size={12} className="mr-1" /> Resubmeter
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(expense.id)} className="text-danger hover:text-danger-hover">
              <Trash2 size={12} className="mr-1" /> Excluir
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
