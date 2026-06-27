export type BillingType = 'hourly' | 'fixed_price';
export type InstallmentStatus = 'pending' | 'invoiced' | 'paid';

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientName?: string;
  status: 'active' | 'paused' | 'finished';
  billingType: BillingType;
  billingRate: number;
  fixedPriceTotal?: string | null;
  budgetHours?: number;
  budgetType?: 'monthly' | 'total';
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInstallment {
  id: string;
  projectId: string;
  installmentNumber: number;
  description: string | null;
  amount: string;
  dueDate: string | null;
  status: InstallmentStatus;
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAllocation {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  costRate?: string;
  billingRate?: string;
  createdAt: string;
}
