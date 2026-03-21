import { api } from './api';
import type { TimeEntry, WeekData, UpsertEntryData } from '../types/time-entry.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function getWeekEntries(date: string): Promise<WeekData> {
  return api<WeekData>(`/time-entries/week?date=${date}`);
}

export async function upsertEntry(data: UpsertEntryData): Promise<TimeEntry> {
  return api<TimeEntry>('/time-entries', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteEntry(id: string): Promise<void> {
  return api<void>(`/time-entries/${id}`, { method: 'DELETE' });
}

export async function submitWeek(weekStartDate: string): Promise<{ submitted: number; warnings: string[] }> {
  return api<{ submitted: number; warnings: string[] }>('/time-entries/submit-week', {
    method: 'POST',
    body: JSON.stringify({ weekStartDate }),
  });
}

export async function resubmitEntry(id: string): Promise<TimeEntry> {
  return api<TimeEntry>(`/time-entries/${id}/resubmit`, { method: 'POST' });
}

// Gestor/Admin
export async function listPending(params?: {
  page?: number;
  limit?: number;
  consultantId?: string;
}): Promise<PaginatedResponse<TimeEntry & { userName?: string; userEmail?: string }>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.consultantId) query.set('consultantId', params.consultantId);
  const qs = query.toString();
  return api(`/time-entries/pending${qs ? `?${qs}` : ''}`);
}

export async function approveEntries(entryIds: string[]): Promise<{ approved: number }> {
  return api<{ approved: number }>('/time-entries/approve', {
    method: 'POST',
    body: JSON.stringify({ entryIds }),
  });
}

export async function rejectEntry(id: string, comment: string): Promise<void> {
  return api<void>(`/time-entries/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

export async function listTimeEntries(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  projectId?: string;
  from?: string;
  to?: string;
  status?: string;
}): Promise<PaginatedResponse<TimeEntry>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.userId) query.set('userId', params.userId);
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return api(`/time-entries${qs ? `?${qs}` : ''}`);
}
