import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading: externalLoading,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  async function handleConfirm() {
    setInternalLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // caller handles error
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel ?? t('common.cancel')}
        </Button>
        <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? t('common.processing') : (confirmLabel ?? t('common.confirm'))}
        </Button>
      </div>
    </Modal>
  );
}
