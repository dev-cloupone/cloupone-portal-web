import { api, BASE_URL, getAccessToken } from './api';
import type { Report, ReportPermissionUser, ExpenseReportResult } from '../types/report.types';

const BASE = '/reports';

export const reportCatalogService = {
  listReports: () => api<Report[]>(`${BASE}`),

  getBySlug: (slug: string) => api<Report>(`${BASE}/${slug}`),

  listPermissions: (reportId: string) =>
    api<ReportPermissionUser[]>(`${BASE}/${reportId}/permissions`),

  updatePermissions: (reportId: string, userIds: string[]) =>
    api(`${BASE}/${reportId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ userIds }),
    }),

  getExpenseData: (params: URLSearchParams) =>
    api<ExpenseReportResult>(`${BASE}/expenses/data?${params.toString()}`),

  getExpensePdfUrl: (params: URLSearchParams) =>
    `${BASE_URL}${BASE}/expenses/pdf?${params.toString()}`,

  downloadPdf: async (url: string, filename: string) => {
    const token = getAccessToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Erro ao gerar PDF');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};
