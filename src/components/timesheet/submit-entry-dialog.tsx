import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface SubmitEntryDialogProps {
  isOpen: boolean;
  onSubmit: () => void;
  onKeepDraft: () => void;
  loading?: boolean;
}

export function SubmitEntryDialog({ isOpen, onSubmit, onKeepDraft, loading }: SubmitEntryDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onKeepDraft} title="Apontamento salvo">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Deseja submeter este apontamento agora?
        </p>

        <div className="modal-actions">
          <Button variant="secondary" type="button" onClick={onKeepDraft} disabled={loading}>
            Manter como rascunho
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Submetendo...' : 'Submeter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
