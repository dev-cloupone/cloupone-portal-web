import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { ProjectSubphase, CreateSubphaseData } from '../../types/phase.types';

interface Props {
  isOpen: boolean;
  subphase?: ProjectSubphase | null;
  onSave: (data: CreateSubphaseData) => Promise<void>;
  onClose: () => void;
}

export function SubphaseFormModal({ isOpen, subphase, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [startDate, setStartDate] = useState('');
  const [businessDays, setBusinessDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(subphase?.name || '');
      setDescription(subphase?.description || '');
      setEstimatedHours(subphase?.estimatedHours ? String(subphase.estimatedHours) : '');
      setStartDate(subphase?.startDate || '');
      setBusinessDays(subphase?.businessDays ? String(subphase.businessDays) : '');
      setError('');
    }
  }, [isOpen, subphase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        startDate: startDate || undefined,
        businessDays: businessDays ? Number(businessDays) : undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title={subphase ? 'Editar Subfase' : 'Nova Subfase'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Horas Estimadas" type="number" step="0.5" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Data Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Dias Úteis" type="number" min="1" value={businessDays} onChange={(e) => setBusinessDays(e.target.value)} />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
