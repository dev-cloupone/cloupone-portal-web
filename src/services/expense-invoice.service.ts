import { api, BASE_URL, getAccessToken } from './api';
import type { ExpenseInvoice } from '../types/financial.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function listInvoices(filters?: {
  page?: number;
  limit?: number;
  clientId?: string;
  projectId?: string;
  status?: string;
  year?: number;
  month?: number;
}): Promise<PaginatedResponse<ExpenseInvoice>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.clientId) params.set('clientId', filters.clientId);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  const qs = params.toString();
  return api(`/invoices/expenses${qs ? `?${qs}` : ''}`);
}

export async function listMyInvoices(filters?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ExpenseInvoice>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api(`/invoices/expenses/my${qs ? `?${qs}` : ''}`);
}

export async function getInvoice(id: string): Promise<ExpenseInvoice> {
  return api(`/invoices/expenses/${id}`);
}

export async function generateDraft(data: {
  projectId: string;
  periodId: string;
}): Promise<ExpenseInvoice> {
  return api('/invoices/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateItems(
  id: string,
  data: {
    items: { id: string; appliedAmount: string; description?: string }[];
    notes?: string;
  },
): Promise<ExpenseInvoice> {
  return api(`/invoices/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function issueInvoice(id: string): Promise<ExpenseInvoice> {
  return api(`/invoices/expenses/${id}/issue`, { method: 'POST' });
}

export async function payInvoice(id: string): Promise<ExpenseInvoice> {
  return api(`/invoices/expenses/${id}/pay`, { method: 'POST' });
}

export async function cancelInvoice(id: string): Promise<ExpenseInvoice> {
  return api(`/invoices/expenses/${id}/cancel`, { method: 'POST' });
}

export async function deleteInvoice(id: string): Promise<void> {
  return api(`/invoices/expenses/${id}`, { method: 'DELETE' });
}

export function getPdfUrl(id: string): string {
  const token = getAccessToken();
  return `${BASE_URL}/invoices/expenses/${id}/pdf${token ? `?token=${token}` : ''}`;
}
