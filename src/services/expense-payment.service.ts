import { api } from './api';
import type { ExpensePayment, AvailableExpensePeriod } from '../types/financial.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function listPayments(filters?: {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  year?: number;
  month?: number;
}): Promise<PaginatedResponse<ExpensePayment>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  const qs = params.toString();
  return api(`/payments/expenses${qs ? `?${qs}` : ''}`);
}

export async function listMyPayments(filters?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ExpensePayment>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api(`/payments/expenses/my${qs ? `?${qs}` : ''}`);
}

export async function getAvailablePeriods(userId: string): Promise<AvailableExpensePeriod[]> {
  const res = await api<{ data: AvailableExpensePeriod[] }>(`/payments/expenses/available-periods?userId=${userId}`);
  return res.data;
}

export async function getPayment(id: string): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}`);
}

export async function generateDraft(data: {
  userId: string;
  periodIds: string[];
}): Promise<ExpensePayment> {
  return api('/payments/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePayment(
  id: string,
  data: { notes?: string },
): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function confirmPayment(id: string): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}/confirm`, { method: 'POST' });
}

export async function payPayment(
  id: string,
  data?: { receiptFileId?: string; notes?: string },
): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}

export async function cancelPayment(id: string): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}/cancel`, { method: 'POST' });
}

export async function revertPayment(id: string): Promise<ExpensePayment> {
  return api(`/payments/expenses/${id}/revert`, { method: 'POST' });
}

export async function deletePayment(id: string): Promise<void> {
  return api(`/payments/expenses/${id}`, { method: 'DELETE' });
}

export async function getReceiptUrl(id: string): Promise<string> {
  const res = await api<{ url: string }>(`/payments/expenses/${id}/receipt`);
  return res.url;
}
