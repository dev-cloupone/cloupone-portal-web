export interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  totalSuperAdmins: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

export interface ManagerDashboardData {
  totalHoursThisMonth: number;
  totalHoursApproved: number;
  totalHoursPending: number;
  pendingApprovalCount: number;
  hoursByProject: Array<{ projectName: string; hours: number }>;
  hoursByConsultant: Array<{ consultantName: string; hours: number }>;
  monthlyTrend: Array<{ month: string; hours: number }>;
  budgetAlerts: Array<{ projectName: string; usedPercent: number }>;
}

export interface ConsultantDashboardData {
  hoursThisWeek: number;
  hoursThisMonth: number;
  weeklyTarget: number;
  projectBreakdown: Array<{ projectName: string; hours: number }>;
  monthlyHistory: Array<{ month: string; hours: number }>;
}
