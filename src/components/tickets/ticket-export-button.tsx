import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ticketService } from '../../services/ticket.service';
import { useAuth } from '../../hooks/use-auth';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import type { ExportTicketParams } from '../../types/ticket.types';

const EXPORT_ROLES = ['super_admin', 'gestor', 'consultor'];

interface TicketExportButtonProps {
  params: ExportTicketParams;
}

export function TicketExportButton({ params }: TicketExportButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const [isExporting, setIsExporting] = useState(false);

  if (!user?.role || !EXPORT_ROLES.includes(user.role)) return null;

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await ticketService.export(params);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get('content-disposition');
      const match = disposition?.match(/filename="?(.+?)"?$/);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] ?? 'tickets.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={isExporting} title={t('tickets.export')}>
      {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
      {t('tickets.export')}
    </Button>
  );
}
