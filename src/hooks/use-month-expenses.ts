import { useState, useEffect, useCallback, useMemo } from 'react';
import * as expenseService from '../services/expense.service';
import type { ExpenseMonthData, ExpenseCalendarDay, ExpenseWeekSummary, UpsertExpenseData } from '../types/expense.types';
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
    if (s === 'draft' || s === 'submitted' || s === 'approved') return s;
  }
  return 'mixed';
}

export function useMonthExpenses() {
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [monthData, setMonthData] = useState<ExpenseMonthData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const loadMonth = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const data = await expenseService.getMonthExpenses(year, month);
      setMonthData(data);
    } catch {
      addToast('Erro ao carregar despesas do mês.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadMonth]);

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
      });

      cursor = addDays(cursor, 1);
    }

    return days;
  }, [monthData, currentYear, currentMonth]);

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
      const statusBreakdown = { draft: 0, submitted: 0, approved: 0, rejected: 0 };
      for (const e of weekExpenses) {
        statusBreakdown[e.status]++;
      }

      summaries.push({
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalAmount,
        expenseCount: weekExpenses.length,
        statusBreakdown,
        hasDraftExpenses: weekExpenses.some(e => e.status === 'draft'),
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

  const submitWeek = useCallback(async (weekStartDate: string) => {
    try {
      const result = await expenseService.submitWeek(weekStartDate);
      if (result.warnings.length > 0) {
        result.warnings.forEach((w) => addToast(w, 'warning'));
      }
      const msgs: string[] = [];
      if (result.autoApproved > 0) msgs.push(`${result.autoApproved} auto-aprovada(s)`);
      if (result.pendingApproval > 0) msgs.push(`${result.pendingApproval} enviada(s) para aprovação`);
      addToast(msgs.join(', ') + '.', 'success');
      await loadMonth(currentYear, currentMonth);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao submeter semana.';
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

  return {
    // State
    currentMonthStr, currentYear, currentMonth, monthData, selectedDate, isLoading,
    // Derived
    calendarDays, selectedDayExpenses, selectedWeekSummary, weekSummaries,
    // Navigation
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    // CRUD
    saveExpense, deleteExpense, submitWeek, resubmitExpense, reload: () => loadMonth(currentYear, currentMonth),
  };
}
