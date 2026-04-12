import { api } from './api';
import type {
  ProjectPhase, ProjectSubphase, SubphaseConsultant,
  CreatePhaseData, UpdatePhaseData, CreateSubphaseData, UpdateSubphaseData,
  AvailableSubphase, PhaseTimeEntriesResponse,
  ClonableProject, ClonePhasesRequest,
} from '../types/phase.types';

// --- Fases ---

export async function listPhases(projectId: string): Promise<{ data: ProjectPhase[] }> {
  return api<{ data: ProjectPhase[] }>(`/projects/${projectId}/phases`);
}

export async function createPhase(projectId: string, data: CreatePhaseData): Promise<ProjectPhase> {
  return api<ProjectPhase>(`/projects/${projectId}/phases`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePhase(phaseId: string, data: UpdatePhaseData): Promise<ProjectPhase> {
  return api<ProjectPhase>(`/phases/${phaseId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deactivatePhase(phaseId: string): Promise<ProjectPhase> {
  return api<ProjectPhase>(`/phases/${phaseId}`, { method: 'DELETE' });
}

export async function reorderPhases(projectId: string, orderedIds: string[]): Promise<void> {
  await api(`/projects/${projectId}/phases/reorder`, { method: 'PUT', body: JSON.stringify({ orderedIds }) });
}

// --- Subfases ---

export async function listSubphases(phaseId: string): Promise<{ data: ProjectSubphase[] }> {
  return api<{ data: ProjectSubphase[] }>(`/phases/${phaseId}/subphases`);
}

export async function createSubphase(phaseId: string, data: CreateSubphaseData): Promise<ProjectSubphase> {
  return api<ProjectSubphase>(`/phases/${phaseId}/subphases`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSubphase(subphaseId: string, data: UpdateSubphaseData): Promise<ProjectSubphase> {
  return api<ProjectSubphase>(`/subphases/${subphaseId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function updateSubphaseStatus(subphaseId: string, status: string): Promise<ProjectSubphase> {
  return api<ProjectSubphase>(`/subphases/${subphaseId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function deactivateSubphase(subphaseId: string): Promise<ProjectSubphase> {
  return api<ProjectSubphase>(`/subphases/${subphaseId}`, { method: 'DELETE' });
}

export async function reorderSubphases(phaseId: string, orderedIds: string[]): Promise<void> {
  await api(`/phases/${phaseId}/subphases/reorder`, { method: 'PUT', body: JSON.stringify({ orderedIds }) });
}

// --- Consultores ---

export async function listSubphaseConsultants(subphaseId: string): Promise<{ data: SubphaseConsultant[] }> {
  return api<{ data: SubphaseConsultant[] }>(`/subphases/${subphaseId}/consultants`);
}

export async function addSubphaseConsultant(subphaseId: string, userId: string, estimatedHours?: number): Promise<SubphaseConsultant> {
  return api<SubphaseConsultant>(`/subphases/${subphaseId}/consultants`, {
    method: 'POST', body: JSON.stringify({ userId, estimatedHours }),
  });
}

export async function updateConsultantHours(subphaseId: string, userId: string, estimatedHours: number): Promise<SubphaseConsultant> {
  return api<SubphaseConsultant>(`/subphases/${subphaseId}/consultants/${userId}`, {
    method: 'PUT', body: JSON.stringify({ estimatedHours }),
  });
}

export async function removeSubphaseConsultant(subphaseId: string, userId: string): Promise<void> {
  await api(`/subphases/${subphaseId}/consultants/${userId}`, { method: 'DELETE' });
}

export async function loadConsultants(phaseId: string): Promise<{ loaded: number }> {
  return api<{ loaded: number }>(`/phases/${phaseId}/load-consultants`, { method: 'POST' });
}

// --- Apontamentos por fase/subfase ---

export async function getSubphaseTimeEntries(
  subphaseId: string,
  params?: { userId?: string; from?: string; to?: string; page?: number; limit?: number },
): Promise<PhaseTimeEntriesResponse> {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api<PhaseTimeEntriesResponse>(`/subphases/${subphaseId}/time-entries${qs ? `?${qs}` : ''}`);
}

export async function getPhaseTimeEntries(
  phaseId: string,
  params?: { userId?: string; subphaseId?: string; from?: string; to?: string; page?: number; limit?: number },
): Promise<PhaseTimeEntriesResponse> {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.subphaseId) query.set('subphaseId', params.subphaseId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api<PhaseTimeEntriesResponse>(`/phases/${phaseId}/time-entries${qs ? `?${qs}` : ''}`);
}

// --- Clone de Fases ---

export async function getClonableProjects(projectId: string): Promise<{ data: ClonableProject[] }> {
  return api<{ data: ClonableProject[] }>(`/projects/${projectId}/phases/clonable-projects`);
}

export async function clonePhases(projectId: string, data: ClonePhasesRequest): Promise<void> {
  await api(`/projects/${projectId}/phases/clone`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Subfases disponíveis para apontamento ---

export async function listAvailableSubphases(projectId: string): Promise<{ data: AvailableSubphase[] }> {
  return api<{ data: AvailableSubphase[] }>(`/projects/${projectId}/available-subphases`);
}
