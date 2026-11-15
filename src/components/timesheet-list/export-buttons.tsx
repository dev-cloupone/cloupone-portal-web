import { useState } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { ExportOptionsModal, type ExportSelection } from './export-options-modal';
import type { TimeEntryListItem } from '../../types/time-entry.types';

interface ExportButtonsProps {
  entries: TimeEntryListItem[];
  totalHours: string;
  currentMonth: string;
  consultantName?: string;
  projectName?: string;
  showConsultantColumn: boolean;
  isSuperAdmin: boolean;
  disabled: boolean;
}

export function ExportButtons({
  entries,
  totalHours,
  currentMonth,
  consultantName,
  projectName,
  showConsultantColumn,
  isSuperAdmin,
  disabled,
}: ExportButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'excel' | 'pdf' | null>(null);

  const runExport = async (format: 'excel' | 'pdf', selection?: ExportSelection) => {
    const baseOptions = {
      entries, totalHours, currentMonth, consultantName, projectName, showConsultantColumn,
      ...(selection ?? {}),
    };
    if (format === 'excel') {
      const { exportToExcel } = await import('../../utils/timesheet-export');
      exportToExcel(baseOptions);
    } else {
      const { exportToPdf } = await import('../../utils/timesheet-export');
      exportToPdf(baseOptions);
    }
  };

  const handleExcel = () => {
    if (isSuperAdmin) {
      setPendingFormat('excel');
      setIsModalOpen(true);
      return;
    }
    runExport('excel');
  };

  const handlePdf = () => {
    if (isSuperAdmin) {
      setPendingFormat('pdf');
      setIsModalOpen(true);
      return;
    }
    runExport('pdf');
  };

  const handleModalConfirm = (selection: ExportSelection) => {
    if (pendingFormat) runExport(pendingFormat, selection);
    setPendingFormat(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleExcel} disabled={disabled} title="Exportar Excel">
        <Download className="w-4 h-4 mr-1" /> Excel
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePdf} disabled={disabled} title="Exportar PDF">
        <Download className="w-4 h-4 mr-1" /> PDF
      </Button>
      {isSuperAdmin && (
        <ExportOptionsModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setPendingFormat(null); }}
          entries={entries}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}
