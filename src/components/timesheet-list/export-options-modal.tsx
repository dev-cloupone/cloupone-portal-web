import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { formatCurrency } from '../../utils/formatters';
import type { TimeEntryListItem } from '../../types/time-entry.types';
import type { RateColumnsOptions, RateSource } from '../../utils/timesheet-export';

export interface ExportSelection {
  hoursField: 'hours' | 'adjustedHours';
  rateColumns: RateColumnsOptions;
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
  const [clientRateSource, setClientRateSource] = useState<RateSource>('real');
  const [consultantRateSource, setConsultantRateSource] = useState<RateSource>('real');

  function hoursOf(entry: TimeEntryListItem): number {
    return Number(entry[hoursField] ?? entry.hours);
  }

  const clientTotal = entries.reduce((sum, e) => {
    const rate = Number((clientRateSource === 'partner' ? e.partnerBillingRate : e.billingRate) ?? 0);
    return sum + rate * hoursOf(e);
  }, 0);
  const consultantTotal = entries.reduce((sum, e) => {
    const rate = Number((consultantRateSource === 'partner' ? e.partnerCostRate : e.costRate) ?? 0);
    return sum + rate * hoursOf(e);
  }, 0);

  function handleClose() {
    setHoursField('hours');
    setClientRateSource('real');
    setConsultantRateSource('real');
    onClose();
  }

  function handleConfirm() {
    onConfirm({ hoursField, rateColumns: { client: clientRateSource, consultant: consultantRateSource } });
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

        <div>
          <label className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('timesheet.exportClientRateLabel')}
            </span>
            <span className="font-mono text-xs text-text-tertiary">{formatCurrency(clientTotal)}</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-client-rate-source"
                value="real"
                checked={clientRateSource === 'real'}
                onChange={() => setClientRateSource('real')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportRateSourceReal')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-client-rate-source"
                value="partner"
                checked={clientRateSource === 'partner'}
                onChange={() => setClientRateSource('partner')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportRateSourcePartner')}
            </label>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t('timesheet.exportConsultantRateLabel')}
            </span>
            <span className="font-mono text-xs text-text-tertiary">{formatCurrency(consultantTotal)}</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-consultant-rate-source"
                value="real"
                checked={consultantRateSource === 'real'}
                onChange={() => setConsultantRateSource('real')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportRateSourceReal')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="export-consultant-rate-source"
                value="partner"
                checked={consultantRateSource === 'partner'}
                onChange={() => setConsultantRateSource('partner')}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              {t('timesheet.exportRateSourcePartner')}
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleConfirm}>{t('timesheet.exportConfirm')}</Button>
        </div>
      </div>
    </Modal>
  );
}
