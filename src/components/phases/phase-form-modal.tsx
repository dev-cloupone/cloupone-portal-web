import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { ProjectPhase, CreatePhaseData } from '../../types/phase.types';

interface Props {
  isOpen: boolean;
  phase?: ProjectPhase | null;
  onSave: (data: CreatePhaseData) => Promise<void>;
  onClose: () => void;
}

export function PhaseFormModal({ isOpen, phase, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(phase?.name || '');
      setDescription(phase?.description || '');
      setError('');
    }
  }, [isOpen, phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t('phases.nameRequired')); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title={phase ? t('phases.editPhaseTitle') : t('phases.newPhaseTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('common.name')} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t('common.description')} value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
