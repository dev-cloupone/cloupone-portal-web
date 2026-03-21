import { api } from './api';
import type { Project, ProjectAllocation } from '../types/project.types';
import type { PaginatedResponse } from '../types/pagination.types';

interface ListParams {
  page?: number;
  limit?: number;
  clientId?: string;
  status?: string;
}

export async function listProjects(params?: ListParams): Promise<PaginatedResponse<Project>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return api<PaginatedResponse<Project>>(`/projects${qs ? `?${qs}` : ''}`);
}

export async function getProject(id: string): Promise<Project> {
  return api<Project>(`/projects/${id}`);
}

export async function createProject(data: Record<string, unknown>): Promise<Project> {
  return api<Project>('/projects', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProject(id: string, data: Record<string, unknown>): Promise<Project> {
  return api<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateProject(id: string): Promise<Project> {
  return api<Project>(`/projects/${id}`, { method: 'DELETE' });
}

export async function listAllocations(projectId: string): Promise<{ data: ProjectAllocation[] }> {
  return api<{ data: ProjectAllocation[] }>(`/projects/${projectId}/allocations`);
}

export async function addAllocation(projectId: string, userId: string): Promise<ProjectAllocation> {
  return api<ProjectAllocation>(`/projects/${projectId}/allocations`, { method: 'POST', body: JSON.stringify({ userId }) });
}

export async function removeAllocation(projectId: string, userId: string): Promise<void> {
  await api(`/projects/${projectId}/allocations/${userId}`, { method: 'DELETE' });
}
