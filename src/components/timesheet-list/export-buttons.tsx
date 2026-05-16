import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import type { TimeEntryListItem } from '../../types/time-entry.types';

interface ExportButtonsProps {
  entries: TimeEntryListItem[];
  totalHours: string;
  currentMonth: string;
  consultantName?: string;
  projectName?: string;
  showConsultantColumn: boolean;
  disabled: boolean;
}

export function ExportButtons({
  entries,
  totalHours,
  currentMonth,
  consultantName,
  projectName,
  showConsultantColumn,
  disabled,
}: ExportButtonsProps) {
  const handleExcel = async () => {
    const { exportToExcel } = await import('../../utils/timesheet-export');
    exportToExcel({ entries, totalHours, currentMonth, consultantName, projectName, showConsultantColumn });
  };

  const handlePdf = async () => {
    const { exportToPdf } = await import('../../utils/timesheet-export');
    exportToPdf({ entries, totalHours, currentMonth, consultantName, projectName, showConsultantColumn });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleExcel} disabled={disabled} title="Exportar Excel">
        <Download className="w-4 h-4 mr-1" /> Excel
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePdf} disabled={disabled} title="Exportar PDF">
        <Download className="w-4 h-4 mr-1" /> PDF
      </Button>
    </div>
  );
}
