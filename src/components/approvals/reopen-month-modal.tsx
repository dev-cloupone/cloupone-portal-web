import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface ReopenMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  monthLabel: string;
}

export function ReopenMonthModal({ isOpen, onClose, onConfirm, monthLabel }: ReopenMonthModalProps) {
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
      setError('O motivo da reabertura e obrigatorio.');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Reabrir Mês">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Reabrir o mês <strong>{monthLabel}</strong> permitirá que o consultor edite seus apontamentos novamente.
        </p>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Motivo da reabertura
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Descreva o motivo da reabertura..."
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
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? 'Reabrindo...' : 'Reabrir'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
