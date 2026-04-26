import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as expenseService from '../services/expense.service';
import * as periodService from '../services/project-expense-period.service';
import type { ExpenseMonthData, ExpenseCalendarDay, ExpenseWeekSummary, UpsertExpenseData, ProjectExpensePeriod } from '../types/expense.types';
import { useToastStore } from '../stores/toast.store';

function formatMonth(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Get Sunday of the week containing the given date (Sunday-Saturday cycle). */
function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeWeekStatus(expenses: { status: string }[]): ExpenseWeekSummary['status'] {
  if (expenses.length === 0) return 'empty';
  const statuses = new Set(expenses.map(e => e.status));
  if (statuses.size === 1) {
    const s = expenses[0].status;
    if (s === 'created' || s === 'draft' || s === 'submitted' || s === 'approved') return s;
  }
  return 'mixed';
}

interface MonthExpensesFilters {
  consultantUserId?: string;
  projectId?: string;
  /** When set, calendar period status is scoped to this project only. */
  periodScopeProjectId?: string;
}

export function useMonthExpenses(projectIds?: string[], filters?: MonthExpensesFilters) {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [monthData, setMonthData] = useState<ExpenseMonthData | null>(null);
  const [periods, setPeriods] = useState<ProjectExpensePeriod[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const loadRequestId = useRef(0);

  const loadMonth = useCallback(async (year: number, month: number) => {
    const thisRequest = ++loadRequestId.current;
    setIsLoading(true);
    try {
      const data = await expenseService.getMonthExpenses(
        year, month, filters?.consultantUserId, filters?.projectId,
      );
      if (thisRequest === loadRequestId.current) {
        setMonthData(data);
      }
    } catch {
      if (thisRequest === loadRequestId.current) {
        addToast('Erro ao carregar despesas do mês.', 'error');
      }
    } finally {
      if (thisRequest === loadRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [addToast, filters?.consultantUserId, filters?.projectId]);

  useEffect(() => {
    loadMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadMonth]);

  // Merge explicit projectIds with project IDs derived from loaded expenses (stable key for deps)
  const effectiveProjectIdsKey = useMemo(() => {
    const ids = new Set(projectIds ?? []);
    if (monthData?.expenses) {
      for (const e of monthData.expenses) {
        if (e.projectId) ids.add(e.projectId);
      }
    }
    return Array.from(ids).sort().join(',');
  }, [projectIds, monthData]);

  // Load periods for all allocated projects for this month
  const periodRequestId = useRef(0);
  useEffect(() => {
    const pids = effectiveProjectIdsKey ? effectiveProjectIdsKey.split(',') : [];
    if (pids.length === 0) {
      setPeriods([]);
      return;
    }
    const thisRequest = ++periodRequestId.current;
    Promise.all(
      pids.map((pid) =>
        periodService.listByProject(pid, { year: currentYear, month: currentMonth })
          .then((res) => res.data)
          .catch(() => [] as ProjectExpensePeriod[]),
      ),
    ).then((results) => {
      if (thisRequest === periodRequestId.current) {
        setPeriods(results.flat());
      }
    });
  }, [effectiveProjectIdsKey, currentYear, currentMonth]);

  /** Get the period status for a given date, optionally scoped to a single project. */
  const getDatePeriodStatus = useCallback((dateStr: string, projectId?: string): 'open' | 'closed' | 'none' => {
    let hasPeriod = false;
    for (const p of periods) {
      if (projectId && p.projectId !== projectId) continue;
      if (dateStr >= p.weekStart && dateStr <= p.weekEnd) {
        if (p.status === 'open') {
          if (p.customDays && p.customDays.length > 0) {
            if (p.customDays.includes(dateStr)) return 'open';
          } else {
            return 'open';
          }
        }
        hasPeriod = true;
      }
    }
    return hasPeriod ? 'closed' : 'none';
  }, [periods]);

  /** Get the set of project IDs that have the given date in an open period. */
  const getOpenProjectIdsForDate = useCallback((dateStr: string): Set<string> => {
    const openIds = new Set<string>();
    for (const p of periods) {
      if (dateStr >= p.weekStart && dateStr <= p.weekEnd && p.status === 'open') {
        if (p.customDays && p.customDays.length > 0) {
          if (p.customDays.includes(dateStr)) openIds.add(p.projectId);
        } else {
          openIds.add(p.projectId);
        }
      }
    }
    return openIds;
  }, [periods]);

  // Build calendar grid (Sunday-Saturday)
  const calendarDays = useMemo((): ExpenseCalendarDay[] => {
    const firstOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastOfMonth = new Date(currentYear, currentMonth, 0);

    // Start from Sunday of the week containing the 1st
    const gridStart = getSunday(firstOfMonth);

    // End on Saturday of the week containing the last day
    const lastDow = lastOfMonth.getDay();
    const gridEnd = lastDow === 6
      ? lastOfMonth
      : addDays(lastOfMonth, 6 - lastDow);

    const today = new Date();
    const todayStr = formatDate(today);
    const entries = monthData?.expenses ?? [];

    const days: ExpenseCalendarDay[] = [];
    let cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const dateStr = formatDate(cursor);
      const dow = cursor.getDay();
      const dayExpenses = entries.filter(e => e.date === dateStr);
      const totalAmount = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      days.push({
        date: dateStr,
        dayNumber: cursor.getDate(),
        isCurrentMonth: cursor.getMonth() === currentMonth - 1 && cursor.getFullYear() === currentYear,
        isToday: dateStr === todayStr,
        isWeekend: dow === 0 || dow === 6,
        expenses: dayExpenses,
        totalAmount,
        periodStatus: getDatePeriodStatus(dateStr, filters?.periodScopeProjectId),
      });

      cursor = addDays(cursor, 1);
    }

    return days;
  }, [monthData, currentYear, currentMonth, getDatePeriodStatus, filters?.periodScopeProjectId]);

  // Expenses for selected day
  const selectedDayExpenses = useMemo(() => {
    if (!selectedDate || !monthData) return [];
    return monthData.expenses
      .filter(e => e.date === selectedDate)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedDate, monthData]);

  // Week summaries for the month (Sunday-Saturday)
  const weekSummaries = useMemo((): ExpenseWeekSummary[] => {
    const firstOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastOfMonth = new Date(currentYear, currentMonth, 0);

    const entries = monthData?.expenses ?? [];
    const summaries: ExpenseWeekSummary[] = [];

    let weekStart = getSunday(firstOfMonth);

    while (weekStart <= lastOfMonth) {
      const weekEnd = addDays(weekStart, 6);
      const weekStartStr = formatDate(weekStart);
      const weekEndStr = formatDate(weekEnd);

      const weekExpenses = entries.filter(e => {
        return e.date >= weekStartStr && e.date <= weekEndStr;
      });

      const totalAmount = weekExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const statusBreakdown = { created: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 };
      for (const e of weekExpenses) {
        statusBreakdown[e.status as keyof typeof statusBreakdown]++;
      }

      summaries.push({
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalAmount,
        expenseCount: weekExpenses.length,
        statusBreakdown,
        hasCreatedExpenses: weekExpenses.some(e => e.status === 'created'),
        status: computeWeekStatus(weekExpenses),
      });

      weekStart = addDays(weekStart, 7);
    }

    return summaries;
  }, [monthData, currentYear, currentMonth]);

  // Week summary for the selected date
  const selectedWeekSummary = useMemo((): ExpenseWeekSummary | null => {
    if (!selectedDate) return null;
    const selectedDay = new Date(selectedDate + 'T12:00:00');
    const weekStart = getSunday(selectedDay);
    const weekStartStr = formatDate(weekStart);
    return weekSummaries.find(w => w.weekStart === weekStartStr) ?? null;
  }, [selectedDate, weekSummaries]);

  // Navigation
  function goToPreviousMonth() {
    if (currentMonth === 1) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (currentMonth === 12) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  }

  function goToCurrentMonth() {
    const now = new Date();
    const { year, month } = formatMonth(now);
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDate(formatDate(now));
  }

  // CRUD
  const saveExpense = useCallback(async (data: UpsertExpenseData) => {
    try {
      await expenseService.upsertExpense(data);
      await loadMonth(currentYear, currentMonth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar despesa.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentYear, currentMonth, loadMonth, addToast]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      await loadMonth(currentYear, currentMonth);
      addToast('Despesa removida.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover despesa.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentYear, currentMonth, loadMonth, addToast]);

  const resubmitExpense = useCallback(async (expenseId: string) => {
    try {
      await expenseService.resubmitExpense(expenseId);
      addToast('Despesa resubmetida com sucesso.', 'success');
      await loadMonth(currentYear, currentMonth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resubmeter despesa.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentYear, currentMonth, loadMonth, addToast]);

  const revertExpense = useCallback(async (expenseId: string) => {
    try {
      await expenseService.revertExpense(expenseId);
      addToast('Despesa revertida para Criada.', 'success');
      await loadMonth(currentYear, currentMonth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reverter despesa.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentYear, currentMonth, loadMonth, addToast]);

  return {
    // State
    currentMonthStr, currentYear, currentMonth, monthData, selectedDate, isLoading, periods,
    // Derived
    calendarDays, selectedDayExpenses, selectedWeekSummary, weekSummaries, getDatePeriodStatus, getOpenProjectIdsForDate,
    // Navigation
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    // CRUD
    saveExpense, deleteExpense, resubmitExpense, revertExpense, reload: () => loadMonth(currentYear, currentMonth),
  };
}
