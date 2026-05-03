import { api } from './api';
import type { ProjectExpensePeriod } from '../types/expense.types';

export async function listByProject(
  projectId: string,
  filters?: { status?: string; year?: number; month?: number },
): Promise<{ data: ProjectExpensePeriod[] }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  const qs = params.toString();
  return api<{ data: ProjectExpensePeriod[] }>(`/projects/${projectId}/expense-periods${qs ? `?${qs}` : ''}`);
}

export async function openPeriod(
  projectId: string,
  data: { weekStart: string; customDays?: string[] },
): Promise<ProjectExpensePeriod> {
  return api<ProjectExpensePeriod>(`/projects/${projectId}/expense-periods`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function closePeriod(
  projectId: string,
  periodId: string,
): Promise<ProjectExpensePeriod> {
  return api<ProjectExpensePeriod>(`/projects/${projectId}/expense-periods/${periodId}/close`, {
    method: 'POST',
  });
}

export async function reopenPeriod(
  projectId: string,
  periodId: string,
): Promise<ProjectExpensePeriod> {
  return api<ProjectExpensePeriod>(`/projects/${projectId}/expense-periods/${periodId}/reopen`, {
    method: 'POST',
  });
}
