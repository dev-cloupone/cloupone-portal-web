import { api, BASE_URL, getAccessToken } from './api';
import type { ClientReportData, ConsultantReportData, EnhancedClientReportData, ExpenseReportData } from '../types/report.types';

export async function getClientReportData(clientId: string, from: string, to: string): Promise<ClientReportData> {
  return api<ClientReportData>(`/reports/client/${clientId}?from=${from}&to=${to}`);
}

export function getClientPdfUrl(clientId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/client/${clientId}/pdf?from=${from}&to=${to}`;
}

export function getClientCsvUrl(clientId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/client/${clientId}/excel?from=${from}&to=${to}`;
}

export function getBillingPdfUrl(from: string, to: string): string {
  return `${BASE_URL}/reports/billing?from=${from}&to=${to}`;
}

export function getPayrollPdfUrl(from: string, to: string): string {
  return `${BASE_URL}/reports/payroll?from=${from}&to=${to}`;
}

// --- Consultant Report ---

export async function getConsultantReportData(consultantId: string, from: string, to: string): Promise<ConsultantReportData> {
  return api<ConsultantReportData>(`/reports/consultant/${consultantId}?from=${from}&to=${to}`);
}

export function getConsultantPdfUrl(consultantId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/consultant/${consultantId}/pdf?from=${from}&to=${to}`;
}

export function getConsultantCsvUrl(consultantId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/consultant/${consultantId}/excel?from=${from}&to=${to}`;
}

// --- Enhanced Client Report ---

export async function getEnhancedClientReportData(clientId: string, from: string, to: string): Promise<EnhancedClientReportData> {
  return api<EnhancedClientReportData>(`/reports/client/${clientId}/enhanced?from=${from}&to=${to}`);
}

export function getEnhancedClientPdfUrl(clientId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/client/${clientId}/enhanced/pdf?from=${from}&to=${to}`;
}

export function getEnhancedClientCsvUrl(clientId: string, from: string, to: string): string {
  return `${BASE_URL}/reports/client/${clientId}/enhanced/excel?from=${from}&to=${to}`;
}

// --- Expense Report ---

function buildExpenseQueryString(from: string, to: string, filters?: { projectId?: string; consultantId?: string; categoryId?: string; reimbursementStatus?: string }): string {
  const params = new URLSearchParams({ from, to });
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.consultantId) params.set('consultantId', filters.consultantId);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.reimbursementStatus) params.set('reimbursementStatus', filters.reimbursementStatus);
  return params.toString();
}

export async function getExpenseReportData(
  from: string, to: string,
  filters?: { projectId?: string; consultantId?: string; categoryId?: string; reimbursementStatus?: string },
): Promise<ExpenseReportData> {
  const qs = buildExpenseQueryString(from, to, filters);
  return api<ExpenseReportData>(`/reports/expenses?${qs}`);
}

export function getExpensePdfUrl(
  from: string, to: string,
  filters?: { projectId?: string; consultantId?: string; categoryId?: string; reimbursementStatus?: string },
): string {
  const qs = buildExpenseQueryString(from, to, filters);
  return `${BASE_URL}/reports/expenses/pdf?${qs}`;
}

export function getExpenseCsvUrl(
  from: string, to: string,
  filters?: { projectId?: string; consultantId?: string; categoryId?: string; reimbursementStatus?: string },
): string {
  const qs = buildExpenseQueryString(from, to, filters);
  return `${BASE_URL}/reports/expenses/excel?${qs}`;
}

export async function downloadReport(url: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao gerar relatorio.' }));
    throw new Error(error.error || 'Erro ao gerar relatorio.');
  }

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
