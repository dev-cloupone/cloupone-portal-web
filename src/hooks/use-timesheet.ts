import { useState, useEffect, useCallback, useMemo } from 'react';
import * as timeEntryService from '../services/time-entry.service';
import type { WeekData, DayGroup, UpsertEntryData } from '../types/time-entry.types';
import { useToastStore } from '../stores/toast.store';

function getStartOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getWeekDates(weekStartDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

export function getDayLabel(index: number): string {
  return DAY_LABELS[index] || '';
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function useTimesheet() {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  const loadWeek = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const data = await timeEntryService.getWeekEntries(date);
      setWeekData(data);
    } catch {
      addToast('Erro ao carregar apontamentos da semana.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadWeek(currentWeekStart);
  }, [currentWeekStart, loadWeek]);

  const saveEntry = useCallback(async (data: UpsertEntryData) => {
    try {
      await timeEntryService.upsertEntry(data);
      await loadWeek(currentWeekStart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar registro.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentWeekStart, loadWeek, addToast]);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      await timeEntryService.deleteEntry(entryId);
      await loadWeek(currentWeekStart);
      addToast('Registro removido.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover registro.';
      addToast(message, 'error');
      throw err;
    }
  }, [currentWeekStart, loadWeek, addToast]);

  function goToPreviousWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  function goToCurrentWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  async function handleSubmitWeek() {
    try {
      const result = await timeEntryService.submitWeek(currentWeekStart);
      if (result.warnings.length > 0) {
        result.warnings.forEach((w) => addToast(w, 'warning'));
      }
      addToast(`${result.submitted} registro(s) submetido(s) com sucesso.`, 'success');
      await loadWeek(currentWeekStart);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao submeter semana.';
      addToast(message, 'error');
      throw err;
    }
  }

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  const dayGroups = useMemo((): DayGroup[] => {
    if (!weekData) return [];

    return weekDates.map((date, index) => {
      const dayEntries = weekData.entries
        .filter(e => e.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const totalHours = dayEntries.reduce(
        (sum, e) => sum + Number(e.hours), 0
      );

      return {
        date,
        dayLabel: getDayLabel(index),
        dateFormatted: formatDateShort(date),
        entries: dayEntries,
        totalHours,
      };
    });
  }, [weekData, weekDates]);

  const hasDraftEntries = useMemo(() => {
    return weekData?.entries.some((e) => e.status === 'draft') ?? false;
  }, [weekData]);

  const weekStatus = useMemo((): 'empty' | 'draft' | 'submitted' | 'approved' | 'mixed' => {
    if (!weekData || weekData.entries.length === 0) return 'empty';
    const statuses = new Set(weekData.entries.map((e) => e.status));
    if (statuses.size === 1) {
      const s = weekData.entries[0].status;
      if (s === 'draft' || s === 'submitted' || s === 'approved') return s;
    }
    return 'mixed';
  }, [weekData]);

  return {
    weekData,
    isLoading,
    currentWeekStart,
    dayGroups,
    weekDates,
    hasDraftEntries,
    weekStatus,
    saveEntry,
    deleteEntry,
    submitWeek: handleSubmitWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    reload: () => loadWeek(currentWeekStart),
  };
}
