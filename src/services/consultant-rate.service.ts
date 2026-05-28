import { api } from './api';
import type { ConsultantProjectRate } from '../types/financial.types';

export async function listProjectRates(projectId: string): Promise<ConsultantProjectRate[]> {
  const res = await api<{ data: ConsultantProjectRate[] }>(`/projects/${projectId}/consultant-rates`);
  return res.data;
}

export async function updateRate(
  projectId: string,
  userId: string,
  data: { costRate: string; billingRate: string },
): Promise<ConsultantProjectRate> {
  return api<ConsultantProjectRate>(`/projects/${projectId}/consultant-rates/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
