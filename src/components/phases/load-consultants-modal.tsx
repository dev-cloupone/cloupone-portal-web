import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface Props {
  isOpen: boolean;
  phaseName: string;
  subphaseCount: number;
  consultantCount: number;
  hasExistingLinks: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function LoadConsultantsModal({ isOpen, phaseName, subphaseCount, consultantCount, hasExistingLinks, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Carregar Consultores" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Isso vinculará <strong>{consultantCount}</strong> consultores a todas as{' '}
          <strong>{subphaseCount}</strong> subfases da fase "<strong>{phaseName}</strong>",
          distribuindo horas estimadas igualmente.
        </p>
        {hasExistingLinks && (
          <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2">
            <p className="text-xs text-warning">
              Subfases com consultores já vinculados serão sobrescritas.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="flex-1">
            {loading ? 'Carregando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
