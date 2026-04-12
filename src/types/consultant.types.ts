export interface Consultant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: 'super_admin' | 'gestor' | 'consultor' | 'user';
  hourlyRate: number;
  contractType: 'clt' | 'pj' | 'horista';
  allowOverlappingEntries: boolean;
  createdAt: string;
  updatedAt: string;
}
