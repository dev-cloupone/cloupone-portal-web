import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface ApproveMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  monthLabel: string;
  totalHours: number;
  targetHours: number;
  entryCount: number;
}

export function ApproveMonthModal({
  isOpen,
  onClose,
  onConfirm,
  monthLabel,
  totalHours,
  targetHours,
  entryCount,
}: ApproveMonthModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const warnings: string[] = [];
  if (totalHours < targetHours) {
    warnings.push(`Total de horas (${totalHours.toFixed(1)}h) esta abaixo da meta mensal (${targetHours}h).`);
  }

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
    <Modal isOpen={isOpen} onClose={onClose} title="Aprovar Mes">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Tem certeza que deseja aprovar seus apontamentos de{' '}
          <strong>{monthLabel}</strong>?
        </p>

        <div className="rounded-lg bg-surface-2 border border-border p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Total de horas</span>
            <span className="font-semibold text-text-primary">{totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Meta mensal</span>
            <span className="text-text-secondary">{targetHours}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Apontamentos</span>
            <span className="text-text-secondary">{entryCount}</span>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-warning">{w}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-text-muted">
          Apos a aprovacao, os registros nao poderao ser editados ate que um gestor reabra o mes.
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Aprovando...' : 'Aprovar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
