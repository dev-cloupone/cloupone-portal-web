import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { getExpenseById } from '../../services/expense.service';
import { formatApiError, BASE_URL } from '../../services/api';
import type { Expense } from '../../types/expense.types';

const STATUS_LABELS: Record<string, string> = {
  created: 'Criado',
  draft: 'Rascunho',
  submitted: 'Submetido',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  created: 'default',
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'danger',
};

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

interface ExpenseDetailModalProps {
  expenseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseDetailModal({ expenseId, isOpen, onClose }: ExpenseDetailModalProps) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !expenseId) {
      setExpense(null);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    getExpenseById(expenseId)
      .then(setExpense)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [isOpen, expenseId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Despesa">
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {!loading && !error && expense && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[expense.status] ?? 'default'}>
              {STATUS_LABELS[expense.status] ?? expense.status}
            </Badge>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">Data</dt>
            <dd className="text-text-primary">{formatDate(expense.date)}</dd>

            {expense.consultantName && (
              <>
                <dt className="text-text-muted">Consultor</dt>
                <dd className="text-text-primary">{expense.consultantName}</dd>
              </>
            )}

            {expense.categoryName && (
              <>
                <dt className="text-text-muted">Categoria</dt>
                <dd className="text-text-primary">{expense.categoryName}</dd>
              </>
            )}

            {expense.description && (
              <>
                <dt className="text-text-muted">Descrição</dt>
                <dd className="text-text-primary">{expense.description}</dd>
              </>
            )}

            <dt className="text-text-muted">Valor lançado</dt>
            <dd className="text-text-primary font-mono">{formatCurrency(expense.amount)}</dd>

            {expense.approvedAmount && expense.approvedAmount !== expense.amount && (
              <>
                <dt className="text-text-muted">Valor Aprovado para Reembolso</dt>
                <dd className="text-text-primary font-mono">{formatCurrency(expense.approvedAmount)}</dd>
              </>
            )}

            {expense.kmQuantity && (
              <>
                <dt className="text-text-muted">KM</dt>
                <dd className="text-text-primary">{expense.kmQuantity} km</dd>
              </>
            )}

            <dt className="text-text-muted">Reembolso</dt>
            <dd className="text-text-primary">
              {expense.requiresReimbursement
                ? expense.reimbursedAt
                  ? 'Reembolsado'
                  : 'Pendente'
                : 'Não'}
            </dd>

            {expense.projectName && (
              <>
                <dt className="text-text-muted">Projeto</dt>
                <dd className="text-text-primary">{expense.projectName}</dd>
              </>
            )}
          </dl>

          {expense.receiptFileId && (
            <a
              href={`${BASE_URL}/uploads/download/${expense.receiptFileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <ExternalLink size={14} />
              Ver comprovante
            </a>
          )}
        </div>
      )}
    </Modal>
  );
}
