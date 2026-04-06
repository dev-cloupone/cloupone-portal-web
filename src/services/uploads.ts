import { apiFetch } from './api';
import type { FileRecord } from '../types/file.types';

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
