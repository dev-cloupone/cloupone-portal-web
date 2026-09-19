import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProjectLockInfo } from '../../types/timesheet-lock.types';
import type { MonthlyTimesheetStatus } from '../../types/monthly-timesheet.types';
import { getShortMonthName } from '../../utils/formatters';

interface Props {
  lockedProjects: ProjectLockInfo[];
  month: string;
  monthStatus?: MonthlyTimesheetStatus | null;
}

export function ProjectLockBanner({ lockedProjects, month, monthStatus }: Props) {
  const { t } = useTranslation();
  if (lockedProjects.length === 0 || monthStatus === 'approved') return null;

  const [yearStr, monthStr] = month.split('-');
  const monthLabel = `${getShortMonthName(parseInt(monthStr, 10) - 1)}/${yearStr}`;

  return (
    <div className="rounded-xl border bg-danger-muted border-danger/20 px-4 py-3 flex items-start gap-2">
      <Lock size={16} className="text-danger shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm text-text-primary">
          {t('timesheet.projectsLocked', { count: lockedProjects.length, month: monthLabel })}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {lockedProjects.map((p) => (
            <span
              key={p.projectId}
              className="inline-flex items-center rounded-md border border-danger/20 bg-surface-1 px-2 py-0.5 text-xs text-text-primary"
            >
              {p.projectName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
