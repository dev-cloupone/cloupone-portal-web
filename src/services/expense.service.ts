import { api } from './api';
import type { Expense, ExpenseMonthData, UpsertExpenseData, SubmitWeekResult, PendingExpense, ReimbursementListResponse } from '../types/expense.types';
import type { PaginatedResponse } from '../types/pagination.types';

// User operations
export async function getMonthExpenses(year: number, month: number): Promise<ExpenseMonthData> {
  return api<ExpenseMonthData>(`/expenses/month?year=${year}&month=${month}`);
}

export async function getWeekExpenses(weekStartDate: string): Promise<{ weekStartDate: string; expenses: Expense[]; totalAmount: number }> {
  return api(`/expenses/week?weekStartDate=${weekStartDate}`);
}

export async function upsertExpense(data: UpsertExpenseData): Promise<Expense> {
  return api<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteExpense(id: string): Promise<void> {
  return api<void>(`/expenses/${id}`, { method: 'DELETE' });
}

export async function submitWeek(weekStartDate: string): Promise<SubmitWeekResult> {
  return api<SubmitWeekResult>('/expenses/submit-week', {
    method: 'POST',
    body: JSON.stringify({ weekStartDate }),
  });
}

export async function resubmitExpense(id: string): Promise<Expense> {
  return api<Expense>(`/expenses/${id}/resubmit`, { method: 'POST' });
}

// Gestor/Admin: Approvals
export async function listPending(params?: {
  page?: number;
  limit?: number;
  consultantId?: string;
  projectId?: string;
}): Promise<PaginatedResponse<PendingExpense>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.consultantId) query.set('consultantId', params.consultantId);
  if (params?.projectId) query.set('projectId', params.projectId);
  const qs = query.toString();
  return api(`/expenses/pending${qs ? `?${qs}` : ''}`);
}

export async function approveExpenses(ids: string[]): Promise<{ approved: number }> {
  return api<{ approved: number }>('/expenses/approve', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function rejectExpense(id: string, comment: string): Promise<void> {
  return api<void>(`/expenses/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

// Gestor/Admin: Reimbursements
export async function listReimbursements(params?: {
  page?: number;
  limit?: number;
  consultantId?: string;
  projectId?: string;
  from?: string;
  to?: string;
  reimbursementStatus?: 'pending' | 'paid';
}): Promise<ReimbursementListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.consultantId) query.set('consultantId', params.consultantId);
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.reimbursementStatus) query.set('reimbursementStatus', params.reimbursementStatus);
  const qs = query.toString();
  return api(`/expenses/reimbursements${qs ? `?${qs}` : ''}`);
}

export async function markAsReimbursed(ids: string[]): Promise<{ reimbursed: number }> {
  return api<{ reimbursed: number }>('/expenses/reimburse', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function unmarkReimbursement(id: string): Promise<Expense> {
  return api<Expense>(`/expenses/${id}/unreimburse`, { method: 'POST' });
}
