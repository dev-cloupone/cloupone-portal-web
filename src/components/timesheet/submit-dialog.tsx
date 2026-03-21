import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface SubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalHours: number;
  targetHours: number;
  entryCount: number;
  isSubmitting: boolean;
}

export function SubmitDialog({
  isOpen,
  onClose,
  onConfirm,
  totalHours,
  targetHours,
  entryCount,
  isSubmitting,
}: SubmitDialogProps) {
  const warnings: string[] = [];
  if (totalHours < targetHours) {
    warnings.push(`Total de horas (${totalHours}h) esta abaixo da meta semanal (${targetHours}h).`);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submeter Semana">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Voce esta prestes a submeter <strong>{entryCount}</strong> registro(s) com um total de{' '}
          <strong>{totalHours}h</strong> para aprovacao do gestor.
        </p>

        {warnings.length > 0 && (
          <div className="rounded-lg bg-warning-muted border border-warning/20 px-3 py-2 space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-warning">
                {w}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-text-muted">
          Apos a submissao, os registros nao poderao ser editados ate que o gestor os aprove ou rejeite.
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Voltar e corrigir
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submetendo...' : 'Submeter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
