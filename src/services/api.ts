import { MSG } from '../constants/messages';

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    if (import.meta.env.PROD) {
      throw new Error('VITE_API_URL is required in production');
    }
    return 'http://localhost:3001/api';
  }

  if (import.meta.env.PROD && !url.startsWith('https://')) {
    throw new Error('VITE_API_URL must use HTTPS in production');
  }

  return url;
}

export const BASE_URL = getBaseUrl();

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

interface RefreshResult {
  success: boolean;
}

let refreshPromise: Promise<RefreshResult> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnAuthFailure(callback: () => void) {
  onAuthFailure = callback;
}

export function triggerAuthFailure() {
  clearAccessToken();
  onAuthFailure?.();
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (err) {
    console.warn('[auth] Failed to parse token expiry:', err);
    return true;
  }
}

async function doRefreshToken(): Promise<RefreshResult> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) return { success: false };

    const data = await response.json();
    accessToken = data.accessToken;
    return { success: true };
  } catch (err) {
    console.warn('[auth] Token refresh failed:', err);
    return { success: false };
  }
}

export async function tryRefreshToken(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401: attempt token refresh and retry once
  if (response.status === 401) {
    const refreshResult = await tryRefreshToken();
    if (refreshResult.success) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // If still 401 after refresh, trigger auth failure
  if (response.status === 401) {
    clearAccessToken();
    onAuthFailure?.();
    throw Object.assign(new Error(MSG.AUTH_FAILED), { status: 401 });
  }

  // Handle 403: access denied
  if (response.status === 403) {
    const errorBody = await response.json().catch(() => ({ error: MSG.ACCESS_DENIED }));
    throw Object.assign(new Error(errorBody.error || MSG.ACCESS_DENIED), { status: 403 });
  }

  // Handle 429: rate limiting
  if (response.status === 429) {
    const errorBody = await response.json().catch(() => ({ error: MSG.REQUEST_ERROR }));
    throw Object.assign(new Error(errorBody.error || MSG.REQUEST_ERROR), {
      status: 429,
      code: errorBody.code as string | undefined,
    });
  }

  // Handle other errors
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: MSG.REQUEST_ERROR }));
    throw Object.assign(new Error(errorBody.error || MSG.REQUEST_ERROR), {
      status: response.status,
      code: errorBody.code as string | undefined,
      fields: errorBody.fields as Array<{ field: string; message: string }> | undefined,
    });
  }

  return response;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function formatApiError(err: unknown): string {
  const e = err as Error & { fields?: Array<{ field: string; message: string }> };
  if (e.fields?.length) {
    return e.fields.map((f) => f.message).join('\n');
  }
  return e.message || MSG.UNEXPECTED_ERROR;
}
