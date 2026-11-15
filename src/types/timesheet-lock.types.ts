export interface TimesheetLockConfig {
  lockDays: number | null;
}

export interface ProjectLockInfo {
  projectId: string;
  projectName: string;
  earliestAllowed: string;
}

export interface LockStatus {
  lockedProjects: ProjectLockInfo[];
}
