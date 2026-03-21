import { api } from './api';
import type { ActivityCategory } from '../types/activity-category.types';

export async function listCategories(): Promise<{ data: ActivityCategory[] }> {
  return api<{ data: ActivityCategory[] }>('/activity-categories');
}

export async function createCategory(data: Partial<ActivityCategory>): Promise<ActivityCategory> {
  return api<ActivityCategory>('/activity-categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCategory(id: string, data: Partial<ActivityCategory>): Promise<ActivityCategory> {
  return api<ActivityCategory>(`/activity-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateCategory(id: string): Promise<ActivityCategory> {
  return api<ActivityCategory>(`/activity-categories/${id}`, { method: 'DELETE' });
}
