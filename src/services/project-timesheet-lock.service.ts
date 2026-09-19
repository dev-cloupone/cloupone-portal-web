import { api } from './api';
import type { TimesheetLockConfig } from '../types/timesheet-lock.types';

export async function getConfig(projectId: string): Promise<TimesheetLockConfig> {
  return api<TimesheetLockConfig>(`/projects/${projectId}/timesheet-lock`);
}

export async function setLockDays(projectId: string, lockDays: number | null): Promise<{ lockDays: number | null }> {
  return api(`/projects/${projectId}/timesheet-lock`, {
    method: 'PATCH',
    body: JSON.stringify({ lockDays }),
  });
}
