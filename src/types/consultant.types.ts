export interface Consultant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  hourlyRate: number;
  contractType: 'clt' | 'pj' | 'horista';
  allowOverlappingEntries: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}
