import { api } from './api';
import type { ConsultantPayment } from '../types/financial.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function listPayments(filters?: {
  page?: number;
  limit?: number;
  userId?: string;
  year?: number;
  month?: number;
  status?: string;
}): Promise<PaginatedResponse<ConsultantPayment>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.month) params.set('month', String(filters.month));
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return api(`/payments/hours${qs ? `?${qs}` : ''}`);
}

export async function listMyPayments(filters?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ConsultantPayment>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api(`/payments/hours/my${qs ? `?${qs}` : ''}`);
}

export async function getPayment(id: string): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}`);
}

export async function generateDraft(data: {
  userId: string;
  year: number;
  month: number;
}): Promise<ConsultantPayment> {
  return api('/payments/hours', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLines(
  id: string,
  data: {
    lines: { id: string; appliedHours: string; appliedRate: string }[];
    notes?: string;
  },
): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function confirmPayment(id: string): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}/confirm`, { method: 'POST' });
}

export async function payPayment(
  id: string,
  data?: { receiptFileId?: string; notes?: string },
): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}

export async function cancelPayment(id: string): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}/cancel`, { method: 'POST' });
}

export async function revertPayment(id: string): Promise<ConsultantPayment> {
  return api(`/payments/hours/${id}/revert`, { method: 'POST' });
}

export async function deletePayment(id: string): Promise<void> {
  return api(`/payments/hours/${id}`, { method: 'DELETE' });
}

export async function getReceiptUrl(id: string): Promise<string> {
  const res = await api<{ url: string }>(`/payments/hours/${id}/receipt`);
  return res.url;
}
