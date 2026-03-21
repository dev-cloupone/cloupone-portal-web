export interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
