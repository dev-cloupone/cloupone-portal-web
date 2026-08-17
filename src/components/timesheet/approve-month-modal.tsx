import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface ApproveMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  monthLabel: string;
  /** Resumo do mes alvo da aprovacao; null enquanto carrega ou se a busca falhar */
  summary: { totalHours: number; entryCount: number } | null;
  isLoadingSummary?: boolean;
}

export function ApproveMonthModal({
  isOpen,
  onClose,
  onConfirm,
  monthLabel,
  summary,
  isLoadingSummary = false,
}: ApproveMonthModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // error handled by caller via toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('timesheet.approveMonthTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: t('timesheet.approveConfirm', { month: monthLabel }) }} />

        <div className="rounded-lg bg-surface-2 border border-border p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">{t('timesheet.totalHoursLabel')}</span>
            <span className="font-semibold text-text-primary">
              {summary ? `${summary.totalHours.toFixed(1)}h` : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">{t('timesheet.entriesLabel')}</span>
            <span className="text-text-secondary">{summary ? summary.entryCount : '—'}</span>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          {t('timesheet.approveDisclaimer')}
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || isLoadingSummary}>
            {isSubmitting ? t('timesheet.approving') : t('timesheet.approve')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
