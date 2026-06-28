import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface RevertInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  type: 'to-draft' | 'to-issued';
  invoiceNumber: number | null;
}

const config = {
  'to-draft': {
    title: 'Reverter para Rascunho',
    description: (num: number | null) =>
      `A fatura${num ? ` Nº ${num}` : ''} será revertida para rascunho. O número da fatura será perdido e não poderá ser reutilizado. O PDF gerado anteriormente não será mais válido. A fatura voltará a ser editável.`,
    confirmLabel: 'Reverter para Rascunho',
    loadingLabel: 'Revertendo...',
  },
  'to-issued': {
    title: 'Reverter para Emitida',
    description: (num: number | null) =>
      `A fatura${num ? ` Nº ${num}` : ''} será marcada como não paga, retornando ao status emitida.`,
    confirmLabel: 'Reverter para Emitida',
    loadingLabel: 'Revertendo...',
  },
} as const;

export function RevertInvoiceModal({ isOpen, onClose, onConfirm, type, invoiceNumber }: RevertInvoiceModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { title, description, confirmLabel, loadingLabel } = config[type];

  function handleClose() {
    if (!isSubmitting) onClose();
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
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {description(invoiceNumber)}
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
