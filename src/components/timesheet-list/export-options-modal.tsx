import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { formatCurrency } from '../../utils/formatters';
import type { TimeEntryListItem } from '../../types/time-entry.types';

export interface ExportSelection {
  hoursField: 'hours' | 'adjustedHours';
  includePartnerBillingRate: boolean;
  includePartnerCostRate: boolean;
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TimeEntryListItem[];
  onConfirm: (selection: ExportSelection) => void;
}

export function ExportOptionsModal({ isOpen, onClose, entries, onConfirm }: ExportOptionsModalProps) {
  const { t } = useTranslation();
  const [hoursField, setHoursField] = useState<'hours' | 'adjustedHours'>('hours');
  const [includePartnerBillingRate, setIncludePartnerBillingRate] = useState(false);
  const [includePartnerCostRate, setIncludePartnerCostRate] = useState(false);

  function hoursOf(entry: TimeEntryListItem): number {
    return Number(entry[hoursField] ?? entry.hours);
  }

  const partnerBillingTotal = entries.reduce((sum, e) => sum + Number(e.partnerBillingRate ?? 0) * hoursOf(e), 0);
  const partnerCostTotal = entries.reduce((sum, e) => sum + Number(e.partnerCostRate ?? 0) * hoursOf(e), 0);

  function handleClose() {
    setHoursField('hours');
    setIncludePartnerBillingRate(false);
    setIncludePartnerCostRate(false);
    onClose();
  }

  function handleConfirm() {
    onConfirm({ hoursField, includePartnerBillingRate, includePartnerCostRate });
    handleClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('timesheet.exportOptionsTitle')}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
            {t('timesheet.exportSumByLabel')}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-hours-field"
                value="hours"
                checked={hoursField === 'hours'}
                onChange={() => setHoursField('hours')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportByHours')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-hours-field"
                value="adjustedHours"
                checked={hoursField === 'adjustedHours'}
                onChange={() => setHoursField('adjustedHours')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportByAdjustedHours')}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between gap-2 text-sm text-text-secondary cursor-pointer">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePartnerBillingRate}
                onChange={(e) => setIncludePartnerBillingRate(e.target.checked)}
                className="rounded border-border"
              />
              {t('timesheet.exportIncludePartnerBillingRate')}
            </span>
            {includePartnerBillingRate && (
              <span className="font-mono text-xs text-text-tertiary">{formatCurrency(partnerBillingTotal)}</span>
            )}
          </label>

          <label className="flex items-center justify-between gap-2 text-sm text-text-secondary cursor-pointer">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePartnerCostRate}
                onChange={(e) => setIncludePartnerCostRate(e.target.checked)}
                className="rounded border-border"
              />
              {t('timesheet.exportIncludePartnerCostRate')}
            </span>
            {includePartnerCostRate && (
              <span className="font-mono text-xs text-text-tertiary">{formatCurrency(partnerCostTotal)}</span>
            )}
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleConfirm}>{t('timesheet.exportConfirm')}</Button>
        </div>
      </div>
    </Modal>
  );
}
