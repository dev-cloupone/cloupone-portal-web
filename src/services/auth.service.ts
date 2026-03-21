import { BASE_URL } from './api';
import type { LoginResponse } from '../types/auth.types';

async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(errorBody.error || 'Request failed'), {
      status: response.status,
      code: errorBody.code as string | undefined,
      fields: errorBody.fields as Array<{ field: string; message: string }> | undefined,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return publicApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return publicApi<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return publicApi<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function register(data: { name: string; email: string; password: string }): Promise<void> {
  await publicApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
