import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import * as phaseService from '../../services/phase.service';
import { formatApiError } from '../../services/api';
import type { ClonableProject, ClonePhasesRequest } from '../../types/phase.types';

interface Props {
  isOpen: boolean;
  projectId: string;
  onClone: (data: ClonePhasesRequest) => Promise<void>;
  onClose: () => void;
}

type Step = 'select-project' | 'select-phases' | 'confirm';

export function ClonePhasesModal({ isOpen, projectId, onClone, onClose }: Props) {
  const [step, setStep] = useState<Step>('select-project');
  const [projects, setProjects] = useState<ClonableProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ClonableProject | null>(null);
  const [selectedPhases, setSelectedPhases] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError('');
    try {
      const result = await phaseService.getClonableProjects(projectId);
      setProjects(result.data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingProjects(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      setStep('select-project');
      setSelectedProject(null);
      setSelectedPhases(new Map());
      setError('');
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  function handleSelectProject(project: ClonableProject) {
    setSelectedProject(project);
    // Auto-select all phases and subphases
    const map = new Map<string, Set<string>>();
    for (const phase of project.phases) {
      map.set(phase.id, new Set(phase.subphases.map(sp => sp.id)));
    }
    setSelectedPhases(map);
    setStep('select-phases');
  }

  function togglePhase(phaseId: string) {
    const next = new Map(selectedPhases);
    if (next.has(phaseId)) {
      next.delete(phaseId);
    } else {
      const phase = selectedProject!.phases.find(p => p.id === phaseId)!;
      next.set(phaseId, new Set(phase.subphases.map(sp => sp.id)));
    }
    setSelectedPhases(next);
  }

  function toggleSubphase(phaseId: string, subphaseId: string) {
    const next = new Map(selectedPhases);
    const subs = next.get(phaseId);
    if (subs) {
      const nextSubs = new Set(subs);
      if (nextSubs.has(subphaseId)) {
        nextSubs.delete(subphaseId);
        if (nextSubs.size === 0) {
          next.delete(phaseId);
        } else {
          next.set(phaseId, nextSubs);
        }
      } else {
        nextSubs.add(subphaseId);
        next.set(phaseId, nextSubs);
      }
    } else {
      next.set(phaseId, new Set([subphaseId]));
    }
    setSelectedPhases(next);
  }

  function toggleAll() {
    if (!selectedProject) return;
    const allSelected = selectedProject.phases.every(
      p => selectedPhases.get(p.id)?.size === p.subphases.length,
    );
    if (allSelected) {
      setSelectedPhases(new Map());
    } else {
      const map = new Map<string, Set<string>>();
      for (const phase of selectedProject.phases) {
        map.set(phase.id, new Set(phase.subphases.map(sp => sp.id)));
      }
      setSelectedPhases(map);
    }
  }

  function getSelectionSummary() {
    let phaseCount = 0;
    let subphaseCount = 0;
    for (const [, subs] of selectedPhases) {
      phaseCount++;
      subphaseCount += subs.size;
    }
    return { phaseCount, subphaseCount };
  }

  async function handleClone() {
    setLoading(true);
    setError('');
    try {
      const data: ClonePhasesRequest = {
        sourceProjectId: selectedProject!.id,
        phases: Array.from(selectedPhases.entries()).map(([phaseId, subIds]) => ({
          phaseId,
          subphaseIds: Array.from(subIds),
        })),
      };
      await onClone(data);
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const { phaseCount, subphaseCount } = getSelectionSummary();

  return (
    <Modal isOpen={isOpen} title="Clonar Fases de Outro Projeto" onClose={onClose} className="max-w-2xl">
      {/* Step 1: Select source project */}
      {step === 'select-project' && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Selecione o projeto de onde deseja clonar as fases:</p>

          {loadingProjects && (
            <p className="text-sm text-text-tertiary py-4 text-center">Carregando projetos...</p>
          )}

          {!loadingProjects && projects.length === 0 && !error && (
            <p className="text-sm text-text-tertiary py-4 text-center">Nenhum projeto disponível para clone</p>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelectProject(project)}
                className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-surface-2 transition-colors"
              >
                <div className="font-medium text-sm text-text-primary">{project.name}</div>
                <div className="text-xs text-text-tertiary mt-0.5">
                  {project.clientName} &middot; {project.phases.length} fase{project.phases.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select phases and subphases */}
      {step === 'select-phases' && selectedProject && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Projeto: <span className="font-medium text-text-primary">{selectedProject.name}</span>
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-accent hover:text-accent/80 font-medium"
            >
              {selectedProject.phases.every(p => selectedPhases.get(p.id)?.size === p.subphases.length)
                ? 'Desmarcar todas'
                : 'Selecionar todas'}
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selectedProject.phases.map((phase) => {
              const phaseSelected = selectedPhases.has(phase.id);
              const selectedSubs = selectedPhases.get(phase.id);
              const allSubsSelected = selectedSubs?.size === phase.subphases.length;

              return (
                <div key={phase.id} className="border border-border rounded-lg overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-2.5 bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
                    <input
                      type="checkbox"
                      checked={phaseSelected && allSubsSelected}
                      ref={(el) => { if (el) el.indeterminate = phaseSelected && !allSubsSelected; }}
                      onChange={() => togglePhase(phase.id)}
                      className="rounded border-border accent-accent"
                    />
                    <span className="font-medium text-sm text-text-primary">{phase.name}</span>
                    <span className="text-xs text-text-tertiary ml-auto">
                      {selectedSubs?.size ?? 0}/{phase.subphases.length}
                    </span>
                  </label>
                  <div className="divide-y divide-border/50">
                    {phase.subphases.map((sp) => (
                      <label key={sp.id} className="flex items-center gap-3 px-4 py-2 pl-10 cursor-pointer hover:bg-surface-2/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSubs?.has(sp.id) ?? false}
                          onChange={() => toggleSubphase(phase.id, sp.id)}
                          className="rounded border-border accent-accent"
                        />
                        <span className="text-sm text-text-secondary">{sp.name}</span>
                        {sp.estimatedHours && (
                          <span className="text-xs text-text-tertiary ml-auto">{sp.estimatedHours}h</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('select-project')} className="flex-1">
              Voltar
            </Button>
            <Button
              type="button"
              disabled={phaseCount === 0}
              onClick={() => setStep('confirm')}
              className="flex-1"
            >
              Revisar ({phaseCount} fase{phaseCount !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedProject && (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-2/50 border border-border p-4 space-y-2">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Origem:</span> {selectedProject.name}
            </p>
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Será clonado:</span>{' '}
              {phaseCount} fase{phaseCount !== 1 ? 's' : ''} e {subphaseCount} subfase{subphaseCount !== 1 ? 's' : ''}
            </p>
            <div className="mt-3 space-y-1">
              {selectedProject.phases
                .filter(p => selectedPhases.has(p.id))
                .map(p => {
                  const subs = selectedPhases.get(p.id)!;
                  return (
                    <div key={p.id}>
                      <p className="text-sm font-medium text-text-primary">{p.name}</p>
                      <div className="pl-4">
                        {p.subphases.filter(sp => subs.has(sp.id)).map(sp => (
                          <p key={sp.id} className="text-xs text-text-tertiary">&bull; {sp.name}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <p className="text-xs text-text-tertiary">
            As subfases serão criadas com status &quot;Planejada&quot;, sem datas e sem consultores vinculados.
          </p>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('select-phases')} disabled={loading} className="flex-1">
              Voltar
            </Button>
            <Button type="button" onClick={handleClone} disabled={loading} className="flex-1">
              <Copy size={16} className="mr-1.5" />
              {loading ? 'Clonando...' : 'Clonar Fases'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
