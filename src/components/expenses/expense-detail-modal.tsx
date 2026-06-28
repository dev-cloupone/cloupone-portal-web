import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { getExpenseById } from '../../services/expense.service';
import { formatApiError, BASE_URL } from '../../services/api';
import type { Expense } from '../../types/expense.types';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

const STATUS_LABEL_KEYS: Record<string, string> = {
  created: 'expenses.statusCreated',
  draft: 'expenses.statusDraft',
  submitted: 'expenses.statusSubmitted',
  approved: 'expenses.statusApproved',
  rejected: 'expenses.statusRejected',
};

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  created: 'default',
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'danger',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(useLocaleStore.getState().locale);
}

interface ExpenseDetailModalProps {
  expenseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseDetailModal({ expenseId, isOpen, onClose }: ExpenseDetailModalProps) {
  const { t } = useTranslation();
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('expenses.detailsTitle')}>
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
              {STATUS_LABEL_KEYS[expense.status] ? t(STATUS_LABEL_KEYS[expense.status]) : expense.status}
            </Badge>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">{t('expenses.detailDate')}</dt>
            <dd className="text-text-primary">{formatDate(expense.date)}</dd>

            {expense.consultantName && (
              <>
                <dt className="text-text-muted">{t('expenses.detailConsultant')}</dt>
                <dd className="text-text-primary">{expense.consultantName}</dd>
              </>
            )}

            {expense.categoryName && (
              <>
                <dt className="text-text-muted">{t('expenses.detailCategory')}</dt>
                <dd className="text-text-primary">{expense.categoryName}</dd>
              </>
            )}

            {expense.description && (
              <>
                <dt className="text-text-muted">{t('expenses.detailDescription')}</dt>
                <dd className="text-text-primary">{expense.description}</dd>
              </>
            )}

            <dt className="text-text-muted">{t('expenses.postedAmount')}</dt>
            <dd className="text-text-primary font-mono">{formatCurrency(expense.amount)}</dd>

            {expense.approvedAmount && expense.approvedAmount !== expense.amount && (
              <>
                <dt className="text-text-muted">{t('expenses.approvedForReimbursement')}</dt>
                <dd className="text-text-primary font-mono">{formatCurrency(expense.approvedAmount)}</dd>
              </>
            )}

            {expense.kmQuantity && (
              <>
                <dt className="text-text-muted">KM</dt>
                <dd className="text-text-primary">{expense.kmQuantity} km</dd>
              </>
            )}

            <dt className="text-text-muted">{t('expenses.reimbursement')}</dt>
            <dd className="text-text-primary">
              {expense.requiresReimbursement
                ? expense.reimbursedAt
                  ? t('expenses.reimbursed')
                  : t('expenses.pendingReimbursement')
                : t('expenses.noReimbursement')}
            </dd>

            {expense.projectName && (
              <>
                <dt className="text-text-muted">{t('expenses.detailProject')}</dt>
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
              {t('expenses.viewReceipt')}
            </a>
          )}
        </div>
      )}
    </Modal>
  );
}
