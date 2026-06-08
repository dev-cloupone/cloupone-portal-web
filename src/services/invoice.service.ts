import { api, BASE_URL, getAccessToken } from './api';
import type { Invoice, InvoiceLine } from '../types/financial.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function listInvoices(filters?: {
  page?: number;
  limit?: number;
  clientId?: string;
  projectId?: string;
  year?: number;
  month?: number;
  status?: string;
}): Promise<PaginatedResponse<Invoice>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.clientId) params.set('clientId', filters.clientId);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return api(`/invoices/hours${qs ? `?${qs}` : ''}`);
}

export async function listMyInvoices(filters?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Invoice>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api(`/invoices/hours/my${qs ? `?${qs}` : ''}`);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return api(`/invoices/hours/${id}`);
}

export async function generateDraft(data: {
  projectId: string;
  year: number;
  month: number;
}): Promise<Invoice> {
  return api('/invoices/hours', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLines(
  id: string,
  data: {
    lines: { id: string; appliedHours: string; appliedRate: string; description?: string }[];
    notes?: string;
  },
): Promise<Invoice> {
  return api(`/invoices/hours/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function issueInvoice(id: string): Promise<Invoice> {
  return api(`/invoices/hours/${id}/issue`, { method: 'POST' });
}

export async function payInvoice(id: string): Promise<Invoice> {
  return api(`/invoices/hours/${id}/pay`, { method: 'POST' });
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  return api(`/invoices/hours/${id}/cancel`, { method: 'POST' });
}

export async function deleteInvoice(id: string): Promise<void> {
  return api(`/invoices/hours/${id}`, { method: 'DELETE' });
}

export function getPdfUrl(id: string): string {
  const token = getAccessToken();
  return `${BASE_URL}/invoices/hours/${id}/pdf${token ? `?token=${token}` : ''}`;
}

export async function addCustomLine(id: string, data: {
  description: string;
  quantity: string;
  unitPrice: string;
}): Promise<InvoiceLine> {
  return api(`/invoices/hours/${id}/lines`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeCustomLine(id: string, lineId: string): Promise<void> {
  return api(`/invoices/hours/${id}/lines/${lineId}`, { method: 'DELETE' });
}

export async function getPendingApprovals(year: number, month: number): Promise<{ count: number; consultants: string[] }> {
  return api(`/invoices/hours/pending-approvals?year=${year}&month=${month}`);
}
