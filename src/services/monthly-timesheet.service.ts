import { api } from './api';
import type { MonthlyTimesheet, PendingMonth } from '../types/monthly-timesheet.types';
import type { TimeEntry } from '../types/time-entry.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function list(params?: {
  year?: number;
  month?: number;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<MonthlyTimesheet>> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));
  if (params?.userId) query.set('userId', params.userId);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api(`/monthly-timesheets${qs ? `?${qs}` : ''}`);
}

export async function getDetail(userId: string, year: number, month: number): Promise<{ timesheet: MonthlyTimesheet; entries: TimeEntry[] }> {
  return api(`/monthly-timesheets/${userId}/${year}/${month}`);
}

export async function getPending(): Promise<PendingMonth[]> {
  return api('/monthly-timesheets/pending');
}

export async function approve(userId: string, year: number, month: number): Promise<void> {
  return api(`/monthly-timesheets/${userId}/${year}/${month}/approve`, { method: 'POST' });
}

export async function reopen(userId: string, year: number, month: number, reason: string): Promise<void> {
  return api(`/monthly-timesheets/${userId}/${year}/${month}/reopen`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
