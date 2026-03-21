import { api } from './api';

// ── Platform Settings ───────────────────────────────────────────────

export interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

export async function listSettings(): Promise<PlatformSetting[]> {
  return api<PlatformSetting[]>('/admin/settings');
}

export async function updateSettings(settings: { key: string; value: string }[]): Promise<PlatformSetting[]> {
  return api<PlatformSetting[]>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

// ── Users ───────────────────────────────────────────────────────────

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: UserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listUsers(params?: UserListParams): Promise<PaginatedUsers> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return api<PaginatedUsers>(`/users${qs ? `?${qs}` : ''}`);
}

export async function createUser(data: { name: string; email: string; password: string; role: string; clientId?: string | null }): Promise<UserRecord> {
  return api<UserRecord>('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: string, data: { name?: string; email?: string; role?: string; isActive?: boolean; clientId?: string | null }): Promise<UserRecord> {
  return api<UserRecord>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateUser(id: string): Promise<UserRecord> {
  return api<UserRecord>(`/users/${id}`, { method: 'DELETE' });
}
