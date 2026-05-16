import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle, List } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { MonthlyTimesheetStatus } from '../../types/monthly-timesheet.types';

interface MonthHeaderProps {
  currentMonth: string;
  monthStatus?: MonthlyTimesheetStatus | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onApproveMonth?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'default' }> = {
  open: { label: 'Aberto', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  reopened: { label: 'Reaberto', variant: 'default' },
};

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
  const navigate = useNavigate();
  const statusCfg = monthStatus ? STATUS_CONFIG[monthStatus] : null;
  const canApprove = monthStatus === 'open' || monthStatus === 'reopened';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Apontamento de Horas
          </h2>
          {statusCfg && <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {canApprove && onApproveMonth && (
            <Button size="sm" onClick={onApproveMonth}>
              <CheckCircle size={14} className="mr-1" /> Aprovar mês
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[140px] text-center">
            {formatMonthLabel(currentMonth)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Proximo mes">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/timesheet/list')}>
            <List size={14} className="mr-1" /> Visão em Lista
          </Button>
        </div>
      </div>

    </div>
  );
}
