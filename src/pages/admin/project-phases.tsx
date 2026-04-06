import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Pencil, Trash2, Users, ChevronDown, ChevronRight, Play, CheckCircle, UserPlus, Clock } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { IconButton } from '../../components/ui/icon-button';
import { useNavItems } from '../../hooks/use-nav-items';
import { useProjectPhases } from '../../hooks/use-project-phases';
import { ProgressBar } from '../../components/phases/progress-bar';
import { SubphaseStatusBadge } from '../../components/phases/subphase-status-badge';
import { PhaseFormModal } from '../../components/phases/phase-form-modal';
import { SubphaseFormModal } from '../../components/phases/subphase-form-modal';
import { LoadConsultantsModal } from '../../components/phases/load-consultants-modal';
import { SubphaseConsultantsModal } from '../../components/phases/subphase-consultants-modal';
import { TimeEntriesModal } from '../../components/phases/time-entries-modal';
import * as projectService from '../../services/project.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import type { ProjectPhase, ProjectSubphase } from '../../types/phase.types';
import type { ProjectAllocation } from '../../types/project.types';

export default function ProjectPhasesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const {
    phases, loading, loadPhases,
    createPhase, updatePhase, deletePhase,
    createSubphase, updateSubphase, deleteSubphase,
    updateSubphaseStatus, loadConsultants,
  } = useProjectPhases(projectId!);

  const [projectName, setProjectName] = useState('');
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Modals
  const [phaseModal, setPhaseModal] = useState<{ open: boolean; phase?: ProjectPhase | null }>({ open: false });
  const [subphaseModal, setSubphaseModal] = useState<{ open: boolean; phaseId: string; subphase?: ProjectSubphase | null }>({ open: false, phaseId: '' });
  const [loadModal, setLoadModal] = useState<{ open: boolean; phase?: ProjectPhase | null }>({ open: false });
  const [consultantsModal, setConsultantsModal] = useState<{ open: boolean; subphaseId: string; subphaseName: string }>({ open: false, subphaseId: '', subphaseName: '' });
  const [timeEntriesModal, setTimeEntriesModal] = useState<{
    open: boolean;
    title: string;
    phaseId?: string;
    subphaseId?: string;
    consultants: { userId: string; userName: string }[];
    subphases: { id: string; name: string }[];
  }>({ open: false, title: '', consultants: [], subphases: [] });

  useEffect(() => {
    if (!projectId) return;
    loadPhases();
    projectService.getProject(projectId).then(p => setProjectName(p.name)).catch(() => {});
    projectService.listAllocations(projectId).then(r => setAllocations(r.data)).catch(() => {});
  }, [projectId, loadPhases]);

  function toggleExpand(phaseId: string) {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  async function handleStatusChange(subphase: ProjectSubphase) {
    const next = subphase.status === 'planned' ? 'in_progress' : subphase.status === 'in_progress' ? 'completed' : null;
    if (!next) return;
    try {
      await updateSubphaseStatus(subphase.id, next);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  async function handleDeletePhase(phaseId: string) {
    if (!confirm('Excluir esta fase?')) return;
    try { await deletePhase(phaseId); } catch (err) { addToast(formatApiError(err), 'error'); }
  }

  async function handleDeleteSubphase(subphaseId: string) {
    if (!confirm('Excluir esta subfase?')) return;
    try { await deleteSubphase(subphaseId); } catch (err) { addToast(formatApiError(err), 'error'); }
  }

  return (
    <SidebarLayout navItems={navItems} title="Fases do Projeto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate('/admin/projects')} aria-label="Voltar">
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{projectName || 'Carregando...'}</h1>
          <p className="text-sm text-text-tertiary">Gestão de fases e subfases</p>
        </div>
        <Button onClick={() => setPhaseModal({ open: true })}>
          <Plus size={16} className="mr-1.5" /> Nova Fase
        </Button>
      </div>

      {/* Loading */}
      {loading && phases.length === 0 && (
        <p className="text-sm text-text-tertiary py-8 text-center">Carregando...</p>
      )}

      {/* Empty */}
      {!loading && phases.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-tertiary mb-4">Nenhuma fase cadastrada</p>
          <Button onClick={() => setPhaseModal({ open: true })}>
            <Plus size={16} className="mr-1.5" /> Criar primeira fase
          </Button>
        </div>
      )}

      {/* Phase list */}
      <div className="space-y-3">
        {phases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          return (
            <div key={phase.id} className="rounded-xl border border-border bg-surface-1 overflow-hidden">
              {/* Phase header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-2 transition-colors"
                onClick={() => toggleExpand(phase.id)}
              >
                <button className="text-text-tertiary">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary truncate">{phase.name}</h3>
                    <span className="text-xs text-text-tertiary">{phase.subphaseCount} subfases</span>
                  </div>
                  {phase.estimatedHours > 0 && (
                    <div className="mt-1 max-w-xs">
                      <ProgressBar estimated={phase.estimatedHours} actual={phase.actualHours} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <IconButton onClick={() => setSubphaseModal({ open: true, phaseId: phase.id })} aria-label="Nova subfase">
                    <Plus size={16} />
                  </IconButton>
                  <IconButton onClick={() => setTimeEntriesModal({
                    open: true,
                    title: phase.name,
                    phaseId: phase.id,
                    consultants: [...new Map((phase.subphases ?? []).flatMap(sp => sp.consultants ?? []).map(c => [c.userId, { userId: c.userId, userName: c.userName }])).values()],
                    subphases: (phase.subphases ?? []).map(sp => ({ id: sp.id, name: sp.name })),
                  })} aria-label="Ver apontamentos">
                    <Clock size={16} />
                  </IconButton>
                  <IconButton onClick={() => setLoadModal({ open: true, phase })} aria-label="Carregar consultores">
                    <Users size={16} />
                  </IconButton>
                  <IconButton onClick={() => setPhaseModal({ open: true, phase })} aria-label="Editar fase">
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton onClick={() => handleDeletePhase(phase.id)} aria-label="Excluir fase">
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>

              {/* Subphases */}
              {isExpanded && (
                <div className="border-t border-border">
                  {(phase.subphases?.length ?? 0) === 0 ? (
                    <p className="px-4 py-3 text-sm text-text-tertiary">Nenhuma subfase</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {(phase.subphases ?? []).map((sp) => (
                        <div key={sp.id} className="px-4 py-3 hover:bg-surface-2/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-text-primary">{sp.name}</span>
                                <SubphaseStatusBadge status={sp.status} />
                              </div>
                              {sp.startDate && (
                                <p className="text-xs text-text-tertiary">
                                  {sp.startDate} → {sp.endDate || '?'} ({sp.businessDays} dias úteis)
                                </p>
                              )}
                              {Number(sp.estimatedHours || 0) > 0 && (
                                <div className="mt-1 max-w-xs">
                                  <ProgressBar estimated={Number(sp.estimatedHours)} actual={sp.actualHours ?? 0} />
                                </div>
                              )}
                              {/* Consultants inline */}
                              {sp.consultants?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {sp.consultants.map((c) => (
                                    <span key={c.userId} className="inline-flex items-center gap-1 text-xs bg-surface-3 text-text-secondary rounded-md px-2 py-0.5">
                                      {c.userName}
                                      {c.estimatedHours && <span className="text-text-tertiary">({Number(c.estimatedHours).toFixed(1)}h)</span>}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {sp.status === 'planned' && (
                                <IconButton onClick={() => handleStatusChange(sp)} aria-label="Iniciar">
                                  <Play size={14} />
                                </IconButton>
                              )}
                              {sp.status === 'in_progress' && (
                                <IconButton onClick={() => handleStatusChange(sp)} aria-label="Concluir">
                                  <CheckCircle size={14} />
                                </IconButton>
                              )}
                              <IconButton onClick={() => setTimeEntriesModal({
                                open: true,
                                title: sp.name,
                                subphaseId: sp.id,
                                consultants: (sp.consultants ?? []).map(c => ({ userId: c.userId, userName: c.userName })),
                                subphases: [],
                              })} aria-label="Ver apontamentos">
                                <Clock size={14} />
                              </IconButton>
                              <IconButton onClick={() => setConsultantsModal({ open: true, subphaseId: sp.id, subphaseName: sp.name })} aria-label="Consultores">
                                <UserPlus size={14} />
                              </IconButton>
                              <IconButton onClick={() => setSubphaseModal({ open: true, phaseId: phase.id, subphase: sp })} aria-label="Editar">
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteSubphase(sp.id)} aria-label="Excluir">
                                <Trash2 size={14} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <PhaseFormModal
        isOpen={phaseModal.open}
        phase={phaseModal.phase}
        onSave={async (data) => {
          if (phaseModal.phase) {
            await updatePhase(phaseModal.phase.id, data);
          } else {
            await createPhase(data);
          }
        }}
        onClose={() => setPhaseModal({ open: false })}
      />

      <SubphaseFormModal
        isOpen={subphaseModal.open}
        subphase={subphaseModal.subphase}
        onSave={async (data) => {
          if (subphaseModal.subphase) {
            await updateSubphase(subphaseModal.subphase.id, data);
          } else {
            await createSubphase(subphaseModal.phaseId, data);
          }
        }}
        onClose={() => setSubphaseModal({ open: false, phaseId: '' })}
      />

      <LoadConsultantsModal
        isOpen={loadModal.open}
        phaseName={loadModal.phase?.name || ''}
        subphaseCount={loadModal.phase?.subphaseCount || 0}
        consultantCount={allocations.length}
        hasExistingLinks={loadModal.phase?.subphases?.some(sp => sp.consultants?.length > 0) || false}
        onConfirm={async () => {
          if (loadModal.phase) {
            await loadConsultants(loadModal.phase.id);
          }
        }}
        onClose={() => setLoadModal({ open: false })}
      />
      <SubphaseConsultantsModal
        isOpen={consultantsModal.open}
        subphaseId={consultantsModal.subphaseId}
        subphaseName={consultantsModal.subphaseName}
        allocations={allocations}
        onClose={() => setConsultantsModal({ open: false, subphaseId: '', subphaseName: '' })}
        onChanged={loadPhases}
      />
      <TimeEntriesModal
        isOpen={timeEntriesModal.open}
        title={timeEntriesModal.title}
        phaseId={timeEntriesModal.phaseId}
        subphaseId={timeEntriesModal.subphaseId}
        consultants={timeEntriesModal.consultants}
        subphases={timeEntriesModal.subphases}
        onClose={() => setTimeEntriesModal({ open: false, title: '', consultants: [], subphases: [] })}
      />
    </SidebarLayout>
  );
}
