export interface TimesheetLockConfig {
  lockDays: number | null;
}

export interface ProjectLockInfo {
  projectId: string;
  projectName: string;
  deadline: string;
}

export interface LockStatus {
  lockedProjects: ProjectLockInfo[];
}
