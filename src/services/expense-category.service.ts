import { api } from './api';
import type { ExpenseCategoryTemplate } from '../types/expense.types';

export async function listCategories(): Promise<{ data: ExpenseCategoryTemplate[] }> {
  return api<{ data: ExpenseCategoryTemplate[] }>('/expense-category-templates');
}

export async function createCategory(data: Partial<ExpenseCategoryTemplate>): Promise<ExpenseCategoryTemplate> {
  return api<ExpenseCategoryTemplate>('/expense-category-templates', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCategory(id: string, data: Partial<ExpenseCategoryTemplate>): Promise<ExpenseCategoryTemplate> {
  return api<ExpenseCategoryTemplate>(`/expense-category-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deactivateCategory(id: string): Promise<ExpenseCategoryTemplate> {
  return api<ExpenseCategoryTemplate>(`/expense-category-templates/${id}`, { method: 'DELETE' });
}

export async function reactivateCategory(id: string): Promise<ExpenseCategoryTemplate> {
  return api<ExpenseCategoryTemplate>(`/expense-category-templates/${id}/reactivate`, { method: 'PATCH' });
}
