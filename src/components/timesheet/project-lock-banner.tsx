import { Lock, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectLockInfo, ProjectDeadlineInfo } from '../../types/timesheet-lock.types';
import { formatDate, getShortMonthName } from '../../utils/formatters';

interface Props {
  lockedProjects: ProjectLockInfo[];
  upcomingDeadlines: ProjectDeadlineInfo[];
  month: string;
}

export function ProjectLockBanner({ lockedProjects, upcomingDeadlines, month }: Props) {
  const { t } = useTranslation();
  if (lockedProjects.length === 0 && upcomingDeadlines.length === 0) return null;

  const [yearStr, monthStr] = month.split('-');
  const monthLabel = `${getShortMonthName(parseInt(monthStr, 10) - 1)}/${yearStr}`;

  return (
    <div className="space-y-2">
      {lockedProjects.map(p => (
        <div key={p.projectId} className="rounded-xl border bg-danger-muted border-danger/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Lock size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary">
              {t('timesheet.projectLocked', { project: p.projectName, month: monthLabel })}
            </p>
          </div>
        </div>
      ))}
      {upcomingDeadlines.map(p => (
        <div key={p.projectId} className="rounded-xl border bg-warning-muted border-warning/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Clock size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary">
              {t('timesheet.projectDeadlineNear', { project: p.projectName, month: monthLabel, deadline: formatDate(p.deadline) })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
