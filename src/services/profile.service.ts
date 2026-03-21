import { api } from './api';

export async function getMe() {
  return api<{ user: Record<string, unknown> }>('/auth/me');
}

export async function updateMe(data: { name?: string; email?: string }) {
  return api<{ user: Record<string, unknown> }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  return api<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
