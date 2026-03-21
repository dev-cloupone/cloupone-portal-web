import { BASE_URL } from './api';

export interface PublicSettings {
  app_name: string;
  allow_self_registration: string;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const response = await fetch(`${BASE_URL}/settings/public`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch public settings');
  }

  return response.json();
}
