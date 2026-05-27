import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import * as monthlyTimesheetService from '../services/monthly-timesheet.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import type { MonthlyTimesheet } from '../types/monthly-timesheet.types';
import type { TimeEntry } from '../types/time-entry.types';

interface Filters {
  userId?: string;
  status?: string;
}

interface DetailData {
  timesheet: MonthlyTimesheet;
  entries: TimeEntry[];
}

export function useMonthlyApprovals() {
  const [timesheets, setTimesheets] = useState<MonthlyTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const limit = 50;

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const date = new Date(y, m - 2, 1);
      return format(date, 'yyyy-MM');
    });
    setPage(1);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const date = new Date(y, m, 1);
      return format(date, 'yyyy-MM');
    });
    setPage(1);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(format(new Date(), 'yyyy-MM'));
    setPage(1);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const [yearStr, monthStr] = currentMonth.split('-');
    try {
      const result = await monthlyTimesheetService.list({
        page,
        limit,
        userId: filters.userId || undefined,
        status: filters.status || undefined,
        year: parseInt(yearStr),
        month: parseInt(monthStr),
      });
      setTimesheets(result.data);
      setTotal(result.meta.total);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDetail = useCallback(async (userId: string, year: number, month: number) => {
    setDetailLoading(true);
    try {
      const data = await monthlyTimesheetService.getDetail(userId, year, month);
      setDetail(data);
    } catch (err) {
      addToast(formatApiError(err), 'error');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [addToast]);

  const closeDetail = useCallback(() => {
    setDetail(null);
  }, []);

  const approveMonth = useCallback(async (userId: string, year: number, month: number) => {
    try {
      await monthlyTimesheetService.approve(userId, year, month);
      addToast('Mes aprovado com sucesso.', 'success');
      setDetail(null);
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    }
  }, [loadData, addToast]);

  const reopenMonth = useCallback(async (userId: string, year: number, month: number, reason: string) => {
    try {
      await monthlyTimesheetService.reopen(userId, year, month, reason);
      addToast('Mes reaberto.', 'warning');
      setDetail(null);
      await loadData();
    } catch (err) {
      addToast(formatApiError(err), 'error');
      throw err;
    }
  }, [loadData, addToast]);

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const pendingCount = timesheets.filter(t => t.status === 'open' || t.status === 'reopened').length;

  return {
    timesheets,
    isLoading,
    error,
    currentMonth,
    filters,
    page,
    total,
    limit,
    pendingCount,
    detail,
    detailLoading,
    setPage,
    updateFilters,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    loadDetail,
    closeDetail,
    approveMonth,
    reopenMonth,
    reload: loadData,
  };
}
