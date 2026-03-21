import { api, apiFetch } from './api';
import type { FileRecord } from '../types/file.types';
import type { User } from '../types/auth.types';

export async function uploadFile(file: File): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiFetch('/uploads', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  return data as FileRecord;
}

export async function uploadAvatar(file: File): Promise<{ user: User; avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiFetch('/auth/me/avatar', {
    method: 'PATCH',
    body: formData,
  });
  return response.json();
}

export async function removeAvatar(): Promise<{ user: User }> {
  return api<{ user: User }>('/auth/me/avatar', { method: 'DELETE' });
}
