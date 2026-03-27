import { api } from './api';
import type { ExpenseCategory } from '../types/expense.types';

export async function listCategories(): Promise<{ data: ExpenseCategory[] }> {
  return api<{ data: ExpenseCategory[] }>('/expense-categories');
}

export async function createCategory(data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
  return api<ExpenseCategory>('/expense-categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCategory(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
  return api<ExpenseCategory>(`/expense-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deactivateCategory(id: string): Promise<ExpenseCategory> {
  return api<ExpenseCategory>(`/expense-categories/${id}`, { method: 'DELETE' });
}
