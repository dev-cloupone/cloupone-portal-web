import { useState, useEffect, useCallback, useMemo } from 'react';
import * as timeEntryService from '../services/time-entry.service';
import type { MonthData, WeekSummary, CalendarDay, UpsertEntryData } from '../types/time-entry.types';
import { useToastStore } from '../stores/toast.store';

function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeWeekStatus(entries: { status: string }[]): WeekSummary['status'] {
  if (entries.length === 0) return 'empty';
  const normalized = entries.map(e => e.status === 'auto_approved' ? 'approved' : e.status);
  const statuses = new Set(normalized);
  if (statuses.size === 1) {
    const s = normalized[0];
    if (s === 'draft' || s === 'submitted' || s === 'approved') return s as WeekSummary['status'];
  }
  return 'mixed';
}

export function useMonthTimesheet() {
  const [currentMonth, setCurrentMonth] = useState(() => formatMonth(new Date()));
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const loadMonth = useCallback(async (month: string) => {
    setIsLoading(true);
    try {
      const data = await timeEntryService.getMonthEntries(month);
      setMonthData(data);
    } catch {
      addToast('Erro ao carregar apontamentos do mes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadMonth(currentMonth);
  }, [currentMonth, loadMonth]);

  // Build calendar grid
  const calendarDays = useMemo((): CalendarDay[] => {
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Start from Monday of the week containing the 1st
    const gridStart = getMonday(firstOfMonth);

    // End on Sunday of the week containing the last day
    const lastDow = lastOfMonth.getDay();
    const gridEnd = lastDow === 0
      ? lastOfMonth
      : addDays(lastOfMonth, 7 - lastDow);

    const today = new Date();
    const todayStr = formatDate(today);
    const entries = monthData?.entries ?? [];

    const days: CalendarDay[] = [];
    let cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const dateStr = formatDate(cursor);
      const dow = cursor.getDay();
      const dayEntries = entries.filter(e => e.date === dateStr);
      const totalHours = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);

      days.push({
        date: dateStr,
        dayNumber: cursor.getDate(),
        isCurrentMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
        isToday: dateStr === todayStr,
        isWeekend: dow === 0 || dow === 6,
        entries: dayEntries,
        totalHours,
      });

      cursor = addDays(cursor, 1);
    }

    return days;
  }, [monthData, currentMonth]);

  // Entries for selected day
  const selectedDayEntries = useMemo(() => {
    if (!selectedDate || !monthData) return [];
    return monthData.entries
      .filter(e => e.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, monthData]);

  // Week summaries for the entire month
  const weekSummaries = useMemo((): WeekSummary[] => {
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const entries = monthData?.entries ?? [];
    const summaries: WeekSummary[] = [];

    // Start from Monday of the week that contains the 1st
    let weekStart = getMonday(firstOfMonth);

    while (weekStart <= lastOfMonth) {
      const weekEnd = addDays(weekStart, 6);
      const weekStartStr = formatDate(weekStart);

      const weekEntries = entries.filter(e => {
        return e.date >= weekStartStr && e.date <= formatDate(weekEnd);
      });

      const totalHours = weekEntries.reduce((sum, e) => sum + Number(e.hours), 0);

      summaries.push({
        weekStartDate: weekStartStr,
        entries: weekEntries,
        totalHours,
        targetHours: 40,
        status: computeWeekStatus(weekEntries),
        hasDraftEntries: weekEntries.some(e => e.status === 'draft'),
      });

      weekStart = addDays(weekStart, 7);
    }

    return summaries;
  }, [monthData, currentMonth]);

  // Week summary for the selected date
  const selectedWeekSummary = useMemo((): WeekSummary | null => {
    if (!selectedDate) return null;
    const selectedDay = new Date(selectedDate + 'T12:00:00');
    const weekStart = getMonday(selectedDay);
    const weekStartStr = formatDate(weekStart);
    return weekSummaries.find(w => w.weekStartDate === weekStartStr) ?? null;
  }, [selectedDate, weekSummaries]);

  // Navigation
  function goToPreviousMonth() {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return formatMonth(d);
    });
    setSelectedDate(null);
  }

  function goToNextMonth() {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m, 1);
      return formatMonth(d);
    });
    setSelectedDate(null);
  }

  function goToCurrentMonth() {
    const now = new Date();
    setCurrentMonth(formatMonth(now));
    setSelectedDate(formatDate(now));
  }

  // CRUD
  const saveEntry = useCallback(async (data: UpsertEntryData) => {
    try {
      const result = await timeEntryService.upsertEntry(data);
      await loadMonth(currentMonth);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar registro.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentMonth, loadMonth, addToast]);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      await timeEntryService.deleteEntry(entryId);
      await loadMonth(currentMonth);
      addToast('Registro removido.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover registro.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentMonth, loadMonth, addToast]);

  const submitEntry = useCallback(async (entryId: string) => {
    try {
      const result = await timeEntryService.submitEntry(entryId);
      await loadMonth(currentMonth);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao submeter apontamento.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentMonth, loadMonth, addToast]);

  const submitWeek = useCallback(async (weekStartDate: string) => {
    try {
      const result = await timeEntryService.submitWeek(weekStartDate);
      if (result.warnings.length > 0) {
        result.warnings.forEach((w) => addToast(w, 'warning'));
      }
      addToast(`${result.submitted} registro(s) submetido(s) com sucesso.`, 'success');
      await loadMonth(currentMonth);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao submeter semana.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentMonth, loadMonth, addToast]);

  return {
    // State
    currentMonth, monthData, selectedDate, isLoading,
    // Derived
    calendarDays, selectedDayEntries, selectedWeekSummary, weekSummaries,
    // Navigation
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    // CRUD
    saveEntry, deleteEntry, submitEntry, submitWeek, reload: () => loadMonth(currentMonth),
  };
}
