import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './icon-button';
import type { PaginationMeta } from '../../types/pagination.types';

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-1 pt-4">
      <span className="text-xs text-text-tertiary">
        {meta.total} {meta.total === 1 ? 'item' : 'itens'}
      </span>
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label="P\u00e1gina anterior"
        >
          <ChevronLeft size={16} />
        </IconButton>
        <span className="text-xs text-text-secondary">
          {meta.page} / {meta.totalPages}
        </span>
        <IconButton
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label="Pr\u00f3xima p\u00e1gina"
        >
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  );
}
