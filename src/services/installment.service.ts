import { api } from './api';
import type { ProjectInstallment } from '../types/project.types';

export async function listInstallments(projectId: string): Promise<{ data: ProjectInstallment[] }> {
  return api<{ data: ProjectInstallment[] }>(`/projects/${projectId}/installments`);
}

export async function createInstallment(projectId: string, data: { amount: number; description?: string; dueDate?: string }): Promise<ProjectInstallment> {
  return api<ProjectInstallment>(`/projects/${projectId}/installments`, { method: 'POST', body: JSON.stringify(data) });
}

export async function createInstallmentBatch(projectId: string, data: { count: number; amount: number; startDate?: string }): Promise<{ data: ProjectInstallment[] }> {
  return api<{ data: ProjectInstallment[] }>(`/projects/${projectId}/installments/batch`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateInstallment(projectId: string, id: string, data: { amount?: number; description?: string; dueDate?: string }): Promise<ProjectInstallment> {
  return api<ProjectInstallment>(`/projects/${projectId}/installments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function removeInstallment(projectId: string, id: string): Promise<void> {
  await api(`/projects/${projectId}/installments/${id}`, { method: 'DELETE' });
}
