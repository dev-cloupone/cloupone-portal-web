import { useState, useCallback } from 'react';
import * as phaseService from '../services/phase.service';
import type {
  ProjectPhase, CreatePhaseData, UpdatePhaseData,
  CreateSubphaseData, UpdateSubphaseData,
} from '../types/phase.types';
import { useToastStore } from '../stores/toast.store';
import { formatApiError } from '../services/api';

export function useProjectPhases(projectId: string) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const loadPhases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await phaseService.listPhases(projectId);
      setPhases(result.data);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, addToast]);

  // --- Phase CRUD ---

  const createPhase = useCallback(async (data: CreatePhaseData) => {
    await phaseService.createPhase(projectId, data);
    addToast('Fase criada com sucesso', 'success');
    await loadPhases();
  }, [projectId, addToast, loadPhases]);

  const updatePhase = useCallback(async (phaseId: string, data: UpdatePhaseData) => {
    await phaseService.updatePhase(phaseId, data);
    addToast('Fase atualizada', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const deletePhase = useCallback(async (phaseId: string) => {
    await phaseService.deactivatePhase(phaseId);
    addToast('Fase excluída', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const reorderPhasesAction = useCallback(async (orderedIds: string[]) => {
    await phaseService.reorderPhases(projectId, orderedIds);
    await loadPhases();
  }, [projectId, loadPhases]);

  // --- Subphase CRUD ---

  const createSubphase = useCallback(async (phaseId: string, data: CreateSubphaseData) => {
    await phaseService.createSubphase(phaseId, data);
    addToast('Subfase criada com sucesso', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const updateSubphase = useCallback(async (subphaseId: string, data: UpdateSubphaseData) => {
    await phaseService.updateSubphase(subphaseId, data);
    addToast('Subfase atualizada', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const deleteSubphase = useCallback(async (subphaseId: string) => {
    await phaseService.deactivateSubphase(subphaseId);
    addToast('Subfase excluída', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const updateSubphaseStatus = useCallback(async (subphaseId: string, status: string) => {
    await phaseService.updateSubphaseStatus(subphaseId, status);
    addToast('Status atualizado', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const reorderSubphasesAction = useCallback(async (phaseId: string, orderedIds: string[]) => {
    await phaseService.reorderSubphases(phaseId, orderedIds);
    await loadPhases();
  }, [loadPhases]);

  // --- Consultants ---

  const addConsultant = useCallback(async (subphaseId: string, userId: string, estimatedHours?: number) => {
    await phaseService.addSubphaseConsultant(subphaseId, userId, estimatedHours);
    addToast('Consultor vinculado', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const removeConsultant = useCallback(async (subphaseId: string, userId: string) => {
    await phaseService.removeSubphaseConsultant(subphaseId, userId);
    addToast('Consultor removido', 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  const updateConsultantHours = useCallback(async (subphaseId: string, userId: string, hours: number) => {
    await phaseService.updateConsultantHours(subphaseId, userId, hours);
    await loadPhases();
  }, [loadPhases]);

  const loadConsultantsAction = useCallback(async (phaseId: string) => {
    const result = await phaseService.loadConsultants(phaseId);
    addToast(`${result.loaded} vínculos criados`, 'success');
    await loadPhases();
  }, [addToast, loadPhases]);

  return {
    phases,
    loading,
    loadPhases,
    createPhase,
    updatePhase,
    deletePhase,
    reorderPhases: reorderPhasesAction,
    createSubphase,
    updateSubphase,
    deleteSubphase,
    updateSubphaseStatus,
    reorderSubphases: reorderSubphasesAction,
    addConsultant,
    removeConsultant,
    updateConsultantHours,
    loadConsultants: loadConsultantsAction,
  };
}
