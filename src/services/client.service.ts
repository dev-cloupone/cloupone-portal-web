import { api } from './api';
import type { Client } from '../types/client.types';
import type { PaginatedResponse } from '../types/pagination.types';

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listClients(params?: ListParams): Promise<PaginatedResponse<Client>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return api<PaginatedResponse<Client>>(`/clients${qs ? `?${qs}` : ''}`);
}

export async function getClient(id: string): Promise<Client> {
  return api<Client>(`/clients/${id}`);
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  return api<Client>('/clients', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  return api<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deactivateClient(id: string): Promise<Client> {
  return api<Client>(`/clients/${id}`, { method: 'DELETE' });
}
