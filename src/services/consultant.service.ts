import { api } from './api';
import type { Consultant } from '../types/consultant.types';
import type { PaginatedResponse } from '../types/pagination.types';

interface ListParams {
  page?: number;
  limit?: number;
}

export async function listConsultants(params?: ListParams): Promise<PaginatedResponse<Consultant>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api<PaginatedResponse<Consultant>>(`/consultants${qs ? `?${qs}` : ''}`);
}

export async function getConsultant(userId: string): Promise<Consultant> {
  return api<Consultant>(`/consultants/${userId}`);
}

export async function createConsultant(data: { userId: string; hourlyRate: number; contractType: string; allowOverlappingEntries?: boolean; requiresApproval?: boolean }): Promise<Consultant> {
  return api<Consultant>('/consultants', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateConsultant(userId: string, data: { hourlyRate?: number; contractType?: string; allowOverlappingEntries?: boolean; requiresApproval?: boolean }): Promise<Consultant> {
  return api<Consultant>(`/consultants/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function listConsultantProjects(userId: string) {
  return api<{ data: Array<{ projectId: string; projectName: string; clientName: string; status: string }> }>(`/consultants/${userId}/projects`);
}
