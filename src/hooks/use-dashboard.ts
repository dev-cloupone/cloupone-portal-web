import { useCallback, useEffect, useState } from 'react';
import type { DashboardData } from '../types/dashboard.types';
import * as dashboardService from '../services/dashboard.service';
import { formatApiError } from '../services/api';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dashboardService.getDashboard();
      setData(result);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
