import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface WeekHeaderProps {
  weekStartDate: string;
  totalHours: number;
  targetHours: number;
  weekStatus: 'empty' | 'draft' | 'submitted' | 'approved' | 'mixed';
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate + 'T12:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = start.toLocaleDateString('pt-BR', { day: '2-digit' });
  const endDay = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return `${startDay} - ${endDay}`;
}

const statusConfig = {
  empty: { label: 'Vazio', variant: 'default' as const },
  draft: { label: 'Rascunho', variant: 'default' as const },
  submitted: { label: 'Submetido', variant: 'warning' as const },
  approved: { label: 'Aprovado', variant: 'success' as const },
  mixed: { label: 'Parcial', variant: 'warning' as const },
};

export function WeekHeader({
  weekStartDate,
  totalHours,
  targetHours,
  weekStatus,
  onPrevious,
  onNext,
  onToday,
}: WeekHeaderProps) {
  const percent = Math.min((totalHours / targetHours) * 100, 100);
  const status = statusConfig[weekStatus];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onPrevious} aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-text-primary min-w-[180px] text-center">
            {formatWeekRange(weekStartDate)}
          </span>
          <Button variant="ghost" size="sm" onClick={onNext} aria-label="Proxima semana">
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            <CalendarDays size={14} className="mr-1" /> Hoje
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>Registrado: {totalHours}h / Meta: {targetHours}h</span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percent >= 100 ? 'bg-accent' : percent >= 75 ? 'bg-warning' : 'bg-text-muted'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
