import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import type { PendingMonth } from '../../types/monthly-timesheet.types';

interface PendingMonthsBannerProps {
  pendingMonths: PendingMonth[];
  onApprove: (year: number, month: number) => void;
  onNavigate: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function PendingMonthsBanner({ pendingMonths, onApprove, onNavigate }: PendingMonthsBannerProps) {
  if (pendingMonths.length === 0) return null;

  return (
    <div className="space-y-2">
      {pendingMonths.map((pm) => {
        const label = `${MONTH_NAMES[pm.month]}/${pm.year}`;
        const isReopened = pm.status === 'reopened';

        return (
          <div
            key={`${pm.year}-${pm.month}`}
            className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${
              isReopened
                ? 'bg-warning-muted border-warning/30'
                : 'bg-warning-muted/50 border-warning/20'
            }`}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-text-primary">
                  {isReopened
                    ? `O mes de ${label} foi reaberto.`
                    : `O mes de ${label} ainda nao foi aprovado.`}
                </p>
                {isReopened && pm.reopenReason && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    Motivo: {pm.reopenReason}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isReopened && (
                <Button size="sm" onClick={() => onApprove(pm.year, pm.month)}>
                  <CheckCircle size={14} className="mr-1" /> Aprovar mes
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onNavigate(pm.year, pm.month)}>
                <Eye size={14} className="mr-1" /> Ver mes
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
