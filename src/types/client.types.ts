export interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
