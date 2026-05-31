import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from './use-auth';
import * as timeEntryService from '../services/time-entry.service';
import * as consultantService from '../services/consultant.service';
import * as projectService from '../services/project.service';
import type { TimeEntryListItem, TimeEntryListParams, ConsultantOption } from '../types/time-entry.types';

interface Filters {
  consultantId?: string;
  projectId?: string;
  all?: boolean;
}

interface ProjectOption { id: string; name: string; }

export function useTimesheetList() {
  const { user } = useAuth();
  const isAdminOrGestor = user?.role === 'super_admin' || user?.role === 'gestor';

  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [filters, setFilters] = useState<Filters>(() =>
    isAdminOrGestor ? { all: true } : {}
  );
  const [entries, setEntries] = useState<TimeEntryListItem[]>([]);
  const [totalHours, setTotalHours] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const isFilterChangeRef = useRef(false);

  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const date = new Date(y, m - 2, 1);
      return format(date, 'yyyy-MM');
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const date = new Date(y, m, 1);
      return format(date, 'yyyy-MM');
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(format(new Date(), 'yyyy-MM'));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    isFilterChangeRef.current = true;
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    isFilterChangeRef.current = true;
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(filters.consultantId || filters.projectId || filters.all);
  }, [filters]);

  // Load initial filter options
  useEffect(() => {
    if (isAdminOrGestor) {
      consultantService.listConsultantsByScope().then(res => setConsultants(res.data));
    }
    projectService.listProjects({ limit: 100 }).then(res =>
      setProjects(res.data.map(p => ({ id: p.id, name: p.name })))
    );
  }, [isAdminOrGestor]);

  // Main data fetch
  useEffect(() => {
    if (isFilterChangeRef.current) {
      setFiltering(true);
    } else {
      setLoading(true);
    }
    const params: TimeEntryListParams = {
      month: currentMonth,
      ...filters,
    };
    timeEntryService.getTimeEntryList(params)
      .then(res => {
        setEntries(res.entries);
        setTotalHours(res.totalHours);
      })
      .catch(() => {
        setEntries([]);
        setTotalHours('0.00');
      })
      .finally(() => {
        setLoading(false);
        setFiltering(false);
        isFilterChangeRef.current = false;
      });
  }, [currentMonth, filters]);

  return {
    currentMonth,
    entries,
    totalHours,
    loading,
    filtering,
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    consultants,
    projects,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    isAdminOrGestor,
    user,
  };
}
