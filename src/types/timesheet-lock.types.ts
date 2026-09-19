export interface TimesheetLockConfig {
  lockDays: number | null;
}

export interface ProjectLockInfo {
  projectId: string;
  projectName: string;
  deadline: string;
}

export interface ProjectDeadlineInfo extends ProjectLockInfo {
  daysLeft: number;
}

export interface LockStatus {
  lockedProjects: ProjectLockInfo[];
  upcomingDeadlines: ProjectDeadlineInfo[];
}
