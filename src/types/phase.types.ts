export type SubphaseStatus = 'planned' | 'in_progress' | 'completed';

export const SUBPHASE_STATUS_LABELS: Record<SubphaseStatus, string> = {
  planned: 'Planejada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

export const SUBPHASE_STATUS_VARIANTS: Record<SubphaseStatus, 'default' | 'warning' | 'success'> = {
  planned: 'default',
  in_progress: 'warning',
  completed: 'success',
};

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculados
  estimatedHours: number;
  actualHours: number;
  subphaseCount: number;
  subphases: ProjectSubphase[];
}

export interface ProjectSubphase {
  id: string;
  phaseId: string;
  name: string;
  description?: string | null;
  status: SubphaseStatus;
  estimatedHours?: number | string | null;
  startDate?: string | null;
  businessDays?: number | null;
  endDate?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculados
  actualHours: number;
  consultants: SubphaseConsultant[];
}

export interface SubphaseConsultant {
  id: string;
  subphaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  estimatedHours?: number | string | null;
  actualHours: number;
  createdAt: string;
}

export interface AvailableSubphase {
  id: string;
  name: string;
  phaseId: string;
  phaseName: string;
  estimatedHours?: number | string | null;
  consultantEstimatedHours?: number | string | null;
  consultantActualHours: number;
}

// --- Apontamentos por fase/subfase ---

export interface PhaseTimeEntrySummary {
  estimatedHours: number;
  actualHours: number;
  percentComplete: number;
}

export interface PhaseTimeEntryItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number | string;
  userName: string;
  description?: string | null;
  subphaseName?: string | null;
}

export interface PhaseTimeEntriesResponse {
  summary: PhaseTimeEntrySummary;
  data: PhaseTimeEntryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Create/Update data ---

export interface CreatePhaseData {
  name: string;
  description?: string;
}

export interface UpdatePhaseData {
  name?: string;
  description?: string;
  order?: number;
}

export interface CreateSubphaseData {
  name: string;
  description?: string;
  estimatedHours?: number;
  startDate?: string;
  businessDays?: number;
}

export interface UpdateSubphaseData {
  name?: string;
  description?: string;
  estimatedHours?: number;
  startDate?: string;
  businessDays?: number;
  order?: number;
}
