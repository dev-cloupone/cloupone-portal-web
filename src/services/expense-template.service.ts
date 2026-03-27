import { api } from './api';
import type { ExpenseTemplate, CreateExpenseTemplateData } from '../types/expense.types';

export async function listTemplates(): Promise<{ data: ExpenseTemplate[] }> {
  return api<{ data: ExpenseTemplate[] }>('/expense-templates');
}

export async function createTemplate(data: CreateExpenseTemplateData): Promise<ExpenseTemplate> {
  return api<ExpenseTemplate>('/expense-templates', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTemplate(id: string, data: Partial<CreateExpenseTemplateData>): Promise<ExpenseTemplate> {
  return api<ExpenseTemplate>(`/expense-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTemplate(id: string): Promise<void> {
  return api<void>(`/expense-templates/${id}`, { method: 'DELETE' });
}
