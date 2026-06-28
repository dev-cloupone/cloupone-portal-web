import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle, List } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLocaleStore } from '../../stores/locale.store';
import type { MonthlyTimesheetStatus } from '../../types/monthly-timesheet.types';

interface MonthHeaderProps {
  currentMonth: string;
  monthStatus?: MonthlyTimesheetStatus | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onApproveMonth?: () => void;
}

const STATUS_KEYS: Record<string, { key: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { key: 'timesheet.statusOpen', variant: 'warning' },
  approved: { key: 'timesheet.statusApproved', variant: 'success' },
  reopened: { key: 'timesheet.statusReopened', variant: 'default' },
};

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString(useLocaleStore.getState().locale, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthHeader({
  currentMonth,
  monthStatus,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onApproveMonth,
}: MonthHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusCfg = monthStatus ? STATUS_KEYS[monthStatus] : null;
  const canApprove = monthStatus === 'open' || monthStatus === 'reopened';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('timesheet.title')}
          </h2>
          {statusCfg && <Badge variant={statusCfg.variant}>{t(statusCfg.key)}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {canApprove && onApproveMonth && (
            <Button size="sm" onClick={onApproveMonth}>
              <CheckCircle size={14} className="mr-1" /> {t('timesheet.approveMonth')}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label={t('common.previousMonth')}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label={t('common.nextMonth')}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> {t('common.today')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/timesheet/list')}>
            <List size={14} className="mr-1" /> {t('timesheet.listView')}
          </Button>
        </div>
      </div>

    </div>
  );
}
