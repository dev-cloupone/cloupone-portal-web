import { api } from './api';
import type { LoginHistoryEntry } from '../types/login-history.types';

export async function getMyLoginHistory(): Promise<LoginHistoryEntry[]> {
  const result = await api<{ data: LoginHistoryEntry[] }>('/auth/me/login-history');
  return result.data;
}

export async function getUserLoginHistory(userId: string): Promise<LoginHistoryEntry[]> {
  const result = await api<{ data: LoginHistoryEntry[] }>(`/users/${userId}/login-history`);
  return result.data;
}
