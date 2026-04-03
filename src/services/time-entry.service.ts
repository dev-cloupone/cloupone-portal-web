import { api } from './api';
import type { TimeEntry, WeekData, MonthData, UpsertEntryData } from '../types/time-entry.types';
import type { PaginatedResponse } from '../types/pagination.types';

export async function getMonthEntries(date: string): Promise<MonthData> {
  return api<MonthData>(`/time-entries/month?date=${date}`);
}

export async function getWeekEntries(date: string): Promise<WeekData> {
  return api<WeekData>(`/time-entries/week?date=${date}`);
}

export async function upsertEntry(data: UpsertEntryData): Promise<TimeEntry> {
  return api<TimeEntry>('/time-entries', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteEntry(id: string): Promise<void> {
  return api<void>(`/time-entries/${id}`, { method: 'DELETE' });
}

export async function listTimeEntries(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  projectId?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedResponse<TimeEntry>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.userId) query.set('userId', params.userId);
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qs = query.toString();
  return api(`/time-entries${qs ? `?${qs}` : ''}`);
}
