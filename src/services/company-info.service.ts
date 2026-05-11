import { api } from './api';

export interface CompanyInfo {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
  zipCode: string;
  cityState: string;
  phone: string | null;
  email: string | null;
  updatedAt: string;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  return api<CompanyInfo>('/admin/company-info');
}

export async function upsertCompanyInfo(data: Omit<CompanyInfo, 'id' | 'updatedAt'>): Promise<CompanyInfo> {
  return api<CompanyInfo>('/admin/company-info', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
