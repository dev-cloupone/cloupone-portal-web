export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientName?: string;
  status: 'active' | 'paused' | 'finished';
  billingRate: number;
  budgetHours?: number;
  budgetType?: 'monthly' | 'total';
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAllocation {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}
