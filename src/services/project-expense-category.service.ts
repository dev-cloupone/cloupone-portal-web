import { api } from './api';
import type { ProjectExpenseCategory } from '../types/expense.types';

export interface ImportCategoryData {
  templateId: string;
  maxAmount?: string | null;
  kmRate?: string | null;
}

export async function listByProject(projectId: string): Promise<{ data: ProjectExpenseCategory[] }> {
  return api<{ data: ProjectExpenseCategory[] }>(`/projects/${projectId}/expense-categories`);
}

export async function importFromTemplate(projectId: string, data: ImportCategoryData): Promise<ProjectExpenseCategory> {
  return api<ProjectExpenseCategory>(`/projects/${projectId}/expense-categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProjectCategory(
  projectId: string,
  categoryId: string,
  data: Partial<{ maxAmount: string | null; kmRate: string | null; isActive: boolean }>,
): Promise<ProjectExpenseCategory> {
  return api<ProjectExpenseCategory>(`/projects/${projectId}/expense-categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivateProjectCategory(projectId: string, categoryId: string): Promise<void> {
  await api(`/projects/${projectId}/expense-categories/${categoryId}`, { method: 'DELETE' });
}
