import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface ReopenMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  monthLabel: string;
}

export function ReopenMonthModal({ isOpen, onClose, onConfirm, monthLabel }: ReopenMonthModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setReason('');
    setError('');
    onClose();
  }

  async function handleConfirm() {
    if (!reason.trim()) {
      setError(t('approvals.reopenReasonRequired'));
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      setReason('');
      handleClose();
    } catch {
      // error handled by caller via toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('approvals.reopenMonthTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: t('approvals.reopenMonthDescription', { month: monthLabel }) }} />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t('approvals.reopenReasonLabel')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t('approvals.reopenReasonPlaceholder')}
            className="block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? t('approvals.reopening') : t('approvals.reopen')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
