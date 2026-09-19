import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, endOfMonth, format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import * as timesheetLockService from '../../services/project-timesheet-lock.service';
import { formatApiError } from '../../services/api';
import { useDateLocale } from '../../hooks/use-locale';

interface Props {
  projectId: string;
}

export function ProjectTimesheetLockConfig({ projectId }: Props) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [lockDaysInput, setLockDaysInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const config = await timesheetLockService.getConfig(projectId);
      setLockDaysInput(config.lockDays === null || config.lockDays === undefined ? '' : String(config.lockDays));
    } catch (err) {
      setError(formatApiError(err));
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const lockDays = lockDaysInput.trim() === '' ? null : Number(lockDaysInput);
      await timesheetLockService.setLockDays(projectId, lockDays);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const now = new Date();
  const monthLabel = format(now, 'MMMM/yyyy', { locale: dateLocale });
  const lockDaysNum = lockDaysInput.trim() === '' ? null : Number(lockDaysInput);
  const deadlineLabel = lockDaysNum !== null && !Number.isNaN(lockDaysNum)
    ? format(addDays(endOfMonth(now), lockDaysNum), 'dd/MM/yyyy')
    : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">{t('projects.timesheetLockTitle')}</h3>

      {error && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <Input
            label={t('projects.timesheetLockDaysLabel')}
            type="number"
            min={0}
            max={90}
            value={lockDaysInput}
            onChange={(e) => setLockDaysInput(e.target.value)}
          />
          <p className="text-xs text-text-tertiary">
            {deadlineLabel
              ? t('projects.timesheetLockHint', { days: lockDaysNum, month: monthLabel, deadline: deadlineLabel })
              : t('projects.timesheetLockNone')}
          </p>
        </div>

        <div className="rounded-lg bg-warning-muted border border-warning/30 px-3 py-2">
          <p className="text-xs text-warning">{t('projects.timesheetLockWarning')}</p>
        </div>

        <Button type="submit" disabled={saving}>{t('common.save')}</Button>
      </form>
    </div>
  );
}
