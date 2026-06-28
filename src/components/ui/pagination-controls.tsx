import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './icon-button';
import type { PaginationMeta } from '../../types/pagination.types';

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  const { t } = useTranslation();
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-1 pt-4">
      <span className="text-xs text-text-tertiary">
        {meta.total} {meta.total === 1 ? t('common.item') : t('common.items')}
      </span>
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label={t('common.previousPage')}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <span className="text-xs text-text-secondary">
          {meta.page} / {meta.totalPages}
        </span>
        <IconButton
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label={t('common.nextPage')}
        >
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  );
}
