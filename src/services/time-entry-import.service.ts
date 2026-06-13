import { api } from './api';
import type {
  ImportValidateResponse,
  ImportConfirmRequest,
  ImportConfirmResponse,
} from '../types/time-entry-import.types';

export async function validateImport(
  file: File,
  consultantId?: string,
): Promise<ImportValidateResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (consultantId) {
    formData.append('consultantId', consultantId);
  }
  return api<ImportValidateResponse>('/time-entries/import/validate', {
    method: 'POST',
    body: formData,
  });
}

export async function confirmImport(
  data: ImportConfirmRequest,
): Promise<ImportConfirmResponse> {
  return api<ImportConfirmResponse>('/time-entries/import/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
