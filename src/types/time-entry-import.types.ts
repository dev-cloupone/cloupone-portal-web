export interface ImportRawRowData {
  date: string;
  project: string;
  phase: string;
  subphase: string;
  ticket: string | null;
  startTime: string;
  endTime: string;
  description: string | null;
}

export interface ImportResolvedIds {
  projectId: string;
  subphaseId: string;
  ticketId: string | null;
}

export type ImportRowStatus = 'valid' | 'warning' | 'error';

export interface ImportValidatedRow {
  row: number;
  data: ImportRawRowData;
  status: ImportRowStatus;
  message: string | null;
  resolvedIds: ImportResolvedIds | null;
}

export interface ImportValidateResponse {
  valid: number;
  warnings: number;
  errors: number;
  rows: ImportValidatedRow[];
}

export interface ImportConfirmRow {
  date: string;
  startTime: string;
  endTime: string;
  projectId: string;
  subphaseId: string;
  ticketId: string | null;
  description: string | null;
}

export interface ImportConfirmRequest {
  consultantId: string;
  rows: ImportConfirmRow[];
  includeDuplicates: boolean;
}

export interface ImportConfirmResponse {
  imported: number;
  skipped: number;
}
