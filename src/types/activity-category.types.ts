export interface ActivityCategory {
  id: string;
  name: string;
  description?: string;
  isBillable: boolean;
  sortOrder: number;
  isActive: boolean;
}
