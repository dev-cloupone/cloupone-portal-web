import { apiFetch } from './api';
import type { FileRecord } from '../types/file.types';

export type UploadType = 'tickets' | 'expenses';

export async function uploadFile(file: File, type: UploadType): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiFetch(`/uploads/${type}`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  return data as FileRecord;
}
