import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';
import * as phaseService from '../../services/phase.service';
import { formatApiError } from '../../services/api';
import type { SubphaseConsultant } from '../../types/phase.types';
import type { ProjectAllocation } from '../../types/project.types';

interface Props {
  isOpen: boolean;
  subphaseId: string;
  subphaseName: string;
  allocations: ProjectAllocation[];
  onClose: () => void;
  onChanged: () => void;
}

export function SubphaseConsultantsModal({ isOpen, subphaseId, subphaseName, allocations, onClose, onChanged }: Props) {
  const [consultants, setConsultants] = useState<SubphaseConsultant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [addHours, setAddHours] = useState('');
  const [editingHours, setEditingHours] = useState<Record<string, string>>({});

  async function loadConsultants() {
    if (!subphaseId) return;
    setLoading(true);
    try {
      const result = await phaseService.listSubphaseConsultants(subphaseId);
      setConsultants(result.data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && subphaseId) {
      setError('');
      setAddUserId('');
      setAddHours('');
      setEditingHours({});
      loadConsultants();
    }
  }, [isOpen, subphaseId]);

  const linkedUserIds = new Set(consultants.map(c => c.userId));
  const availableAllocations = allocations.filter(a => !linkedUserIds.has(a.userId));

  async function handleAdd() {
    if (!addUserId) return;
    setError('');
    try {
      await phaseService.addSubphaseConsultant(subphaseId, addUserId, addHours ? Number(addHours) : undefined);
      setAddUserId('');
      setAddHours('');
      await loadConsultants();
      onChanged();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleRemove(userId: string) {
    setError('');
    try {
      await phaseService.removeSubphaseConsultant(subphaseId, userId);
      await loadConsultants();
      onChanged();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleSaveHours(userId: string) {
    const hours = editingHours[userId];
    if (!hours || Number(hours) <= 0) return;
    setError('');
    try {
      await phaseService.updateConsultantHours(subphaseId, userId, Number(hours));
      setEditingHours(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await loadConsultants();
      onChanged();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Consultores — ${subphaseName}`}>
      <div className="space-y-4">
        {/* Add consultant */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Adicionar consultor</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                options={availableAllocations.map(a => ({ value: a.userId, label: `${a.userName} (${a.userEmail})` }))}
                value={addUserId}
                onChange={setAddUserId}
                placeholder={availableAllocations.length === 0 ? 'Todos já vinculados' : 'Selecione...'}
                disabled={availableAllocations.length === 0}
              />
            </div>
            <div className="w-24">
              <Input type="number" step="0.5" min="0" placeholder="Horas" value={addHours} onChange={e => setAddHours(e.target.value)} />
            </div>
            <Button onClick={handleAdd} disabled={!addUserId}>Adicionar</Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Consultant list */}
        {loading ? (
          <p className="text-sm text-text-tertiary text-center py-4">Carregando...</p>
        ) : consultants.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">Nenhum consultor vinculado</p>
        ) : (
          <div className="space-y-2">
            {consultants.map(c => {
              const isEditing = c.userId in editingHours;
              return (
                <div key={c.userId} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.userName}</p>
                    <p className="text-xs text-text-muted truncate">{c.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={editingHours[c.userId]}
                          onChange={e => setEditingHours(prev => ({ ...prev, [c.userId]: e.target.value }))}
                          className="w-20 !py-1 text-xs"
                        />
                        <Button size="sm" onClick={() => handleSaveHours(c.userId)}>OK</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingHours(prev => {
                          const next = { ...prev };
                          delete next[c.userId];
                          return next;
                        })}>X</Button>
                      </>
                    ) : (
                      <button
                        className="text-xs text-accent hover:text-accent-hover transition-colors px-2 py-1 rounded hover:bg-surface-3"
                        onClick={() => setEditingHours(prev => ({ ...prev, [c.userId]: c.estimatedHours ? String(c.estimatedHours) : '' }))}
                      >
                        {c.estimatedHours ? `${Number(c.estimatedHours).toFixed(1)}h` : 'Definir horas'}
                      </button>
                    )}
                    <IconButton variant="danger" onClick={() => handleRemove(c.userId)} aria-label="Remover">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
