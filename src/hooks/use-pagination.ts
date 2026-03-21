import { useState, useCallback } from 'react';
import type { PaginationMeta } from '../types/pagination.types';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 20 } = options;
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if (meta && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  }, [meta, page]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    meta,
    setMeta,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: meta ? page < meta.totalPages : false,
    hasPrevPage: page > 1,
    queryParams: `page=${page}&limit=${limit}`,
  };
}
