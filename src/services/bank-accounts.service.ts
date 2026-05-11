import { api } from './api';

export interface BankAccount {
  id: string;
  label: string;
  holderName: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: 'corrente' | 'poupanca';
  pixKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountOption {
  id: string;
  label: string;
}

export async function listBankAccounts(includeInactive = false): Promise<BankAccount[]> {
  const qs = includeInactive ? '?includeInactive=true' : '';
  return api<BankAccount[]>(`/admin/bank-accounts${qs}`);
}

export async function listActiveBankAccounts(): Promise<BankAccountOption[]> {
  return api<BankAccountOption[]>('/bank-accounts/active');
}

export async function createBankAccount(data: Omit<BankAccount, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<BankAccount> {
  return api<BankAccount>('/admin/bank-accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBankAccount(id: string, data: Partial<Omit<BankAccount, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>>): Promise<BankAccount> {
  return api<BankAccount>(`/admin/bank-accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleBankAccount(id: string): Promise<BankAccount> {
  return api<BankAccount>(`/admin/bank-accounts/${id}`, {
    method: 'DELETE',
  });
}
