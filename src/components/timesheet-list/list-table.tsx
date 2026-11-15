import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as timeEntryService from '../../services/time-entry.service';
import type { TimeEntryListItem } from '../../types/time-entry.types';

interface ListTableProps {
  entries: TimeEntryListItem[];
  totalHours: string;
  loading: boolean;
  filtering: boolean;
  showConsultantColumn: boolean;
  isSuperAdmin: boolean;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-3" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ListTable({ entries, totalHours, loading, filtering, showConsultantColumn, isSuperAdmin }: ListTableProps) {
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [adjustedHoursDraft, setAdjustedHoursDraft] = useState<Record<string, string>>({});
  const colCount = (showConsultantColumn ? 9 : 8) + (isSuperAdmin ? 1 : 0);

  async function handleAdjustedHoursBlur(entry: TimeEntryListItem, value: string) {
    if (Number(value) === Number(entry.adjustedHours ?? 0)) return;
    try {
      await timeEntryService.updateAdjustedHours(entry.id, value);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  const totalAdjustedHours = entries.reduce((sum, e) => sum + Number(adjustedHoursDraft[e.id] ?? e.adjustedHours ?? 0), 0).toFixed(2);

  if (loading) {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('timesheet.dateColumn')}</TableHeader>
            {showConsultantColumn && <TableHeader>{t('timesheet.consultantColumn')}</TableHeader>}
            <TableHeader>{t('timesheet.projectColumn')}</TableHeader>
            <TableHeader>{t('timesheet.subphaseColumn')}</TableHeader>
            <TableHeader>{t('timesheet.ticketColumn')}</TableHeader>
            <TableHeader>{t('timesheet.startColumn')}</TableHeader>
            <TableHeader>{t('timesheet.endColumn')}</TableHeader>
            <TableHeader>{t('timesheet.hoursColumn')}</TableHeader>
            {isSuperAdmin && <TableHeader>{t('timesheet.adjustedHoursColumn')}</TableHeader>}
            <TableHeader>{t('timesheet.descriptionColumn')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} cols={colCount} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-text-muted transition-opacity duration-150 ${filtering ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm">{t('timesheet.noEntriesFound')}</p>
      </div>
    );
  }

  return (
    <Table className={`transition-opacity duration-150 ${filtering ? 'opacity-50 pointer-events-none' : ''}`}>
      <TableHead>
        <TableRow>
          <TableHeader>{t('timesheet.dateColumn')}</TableHeader>
          {showConsultantColumn && <TableHeader>{t('timesheet.consultantColumn')}</TableHeader>}
          <TableHeader>{t('timesheet.projectColumn')}</TableHeader>
          <TableHeader>{t('timesheet.subphaseColumn')}</TableHeader>
          <TableHeader>{t('timesheet.ticketColumn')}</TableHeader>
          <TableHeader>{t('timesheet.startColumn')}</TableHeader>
          <TableHeader>{t('timesheet.endColumn')}</TableHeader>
          <TableHeader className="text-right">{t('timesheet.hoursColumn')}</TableHeader>
          {isSuperAdmin && <TableHeader className="text-right">{t('timesheet.adjustedHoursColumn')}</TableHeader>}
          <TableHeader>{t('timesheet.descriptionColumn')}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
            {showConsultantColumn && <TableCell>{entry.consultantName}</TableCell>}
            <TableCell>{entry.projectName}</TableCell>
            <TableCell>{entry.subphaseName || '-'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{entry.ticketCode || '-'}</TableCell>
            <TableCell className="whitespace-nowrap">{entry.startTime.slice(0, 5)}</TableCell>
            <TableCell className="whitespace-nowrap">{entry.endTime.slice(0, 5)}</TableCell>
            <TableCell className="text-right font-medium whitespace-nowrap">{Number(entry.hours).toFixed(2)}</TableCell>
            {isSuperAdmin && (
              <TableCell>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="24"
                  value={adjustedHoursDraft[entry.id] ?? entry.adjustedHours ?? ''}
                  onChange={(e) => setAdjustedHoursDraft((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                  onBlur={(e) => handleAdjustedHoursBlur(entry, e.target.value)}
                  className="w-20 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-sm font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
              </TableCell>
            )}
            <TableCell className="max-w-[250px] truncate">{entry.description || '-'}</TableCell>
          </TableRow>
        ))}
        {/* Total row */}
        <tr className="bg-surface-2 font-semibold">
          <td colSpan={(showConsultantColumn ? 7 : 6)} className="px-4 py-3.5 text-sm text-text-secondary text-right">
            {t('timesheet.totalLabel')}
          </td>
          <td className="px-4 py-3.5 text-sm text-text-secondary text-right font-bold">
            {totalHours}h
          </td>
          {isSuperAdmin && (
            <td className="px-4 py-3.5 text-sm text-text-secondary text-right font-bold">
              {totalAdjustedHours}h
            </td>
          )}
          <td className="px-4 py-3.5" />
        </tr>
      </TableBody>
    </Table>
  );
}
