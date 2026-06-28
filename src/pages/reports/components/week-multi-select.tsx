import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect, useRef } from 'react';
import { startOfMonth, endOfMonth, subMonths, subWeeks, startOfYear, format } from 'date-fns';
import { useLocaleStore } from '../../../stores/locale.store';
import type { ProjectExpensePeriod } from '../../../types/expense.types';

interface WeekMultiSelectProps {
  periods: ProjectExpensePeriod[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const locale = useLocaleStore.getState().locale;
  const s = new Date(weekStart + 'T12:00:00');
  const e = new Date(weekEnd + 'T12:00:00');
  return `${s.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} a ${e.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(useLocaleStore.getState().locale, { month: 'long', year: 'numeric' });
}

const dateInputClass = 'block w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none';
const chipClass = 'rounded-md bg-surface-3 px-2 py-1 text-xs text-text-secondary hover:bg-surface-4 hover:text-text-primary transition-colors';
const chipActiveClass = 'rounded-md bg-accent/15 px-2 py-1 text-xs text-accent hover:bg-accent/25 transition-colors';

type RangePreset = 'last-week' | 'last-month' | 'last-3-months' | 'last-semester' | 'current-year' | 'all';

function getPresetRange(preset: RangePreset, periods: ProjectExpensePeriod[]): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case 'last-week':
      return { start: toISO(subWeeks(now, 1)), end: toISO(now) };
    case 'last-month':
      return { start: toISO(startOfMonth(subMonths(now, 1))), end: toISO(endOfMonth(subMonths(now, 1))) };
    case 'last-3-months':
      return { start: toISO(startOfMonth(subMonths(now, 3))), end: toISO(now) };
    case 'last-semester':
      return { start: toISO(startOfMonth(subMonths(now, 6))), end: toISO(now) };
    case 'current-year':
      return { start: toISO(startOfYear(now)), end: toISO(now) };
    case 'all': {
      if (periods.length === 0) return { start: '', end: '' };
      const sorted = [...periods].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
      return { start: sorted[0].weekStart, end: sorted[sorted.length - 1].weekEnd };
    }
  }
}

function getDefaultRange(periods: ProjectExpensePeriod[]): { start: string; end: string; preset: RangePreset } {
  const lastMonth = getPresetRange('last-month', periods);
  const hasPeriodsInRange = periods.some((p) => p.weekEnd >= lastMonth.start && p.weekStart <= lastMonth.end);
  if (hasPeriodsInRange) return { ...lastMonth, preset: 'last-month' };

  return { ...getPresetRange('all', periods), preset: 'all' };
}

export function WeekMultiSelect({ periods, selectedIds, onChange }: WeekMultiSelectProps) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<RangePreset | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const selectedSet = new Set(selectedIds);

  // Initialize date range when periods load
  useEffect(() => {
    if (periods.length === 0) {
      setStartDate('');
      setEndDate('');
      setActivePreset(null);
      initializedRef.current = false;
      return;
    }
    const def = getDefaultRange(periods);
    setStartDate(def.start);
    setEndDate(def.end);
    setActivePreset(def.preset);
    initializedRef.current = true;
  }, [periods]);

  // Filter periods by date range
  const filteredPeriods = useMemo(() => {
    if (!startDate && !endDate) return periods;
    return periods.filter((p) => {
      if (startDate && p.weekEnd < startDate) return false;
      if (endDate && p.weekStart > endDate) return false;
      return true;
    });
  }, [periods, startDate, endDate]);

  // Clean up selections when filtered periods change
  useEffect(() => {
    if (!initializedRef.current) return;
    const visibleIds = new Set(filteredPeriods.map((p) => p.id));
    const cleaned = selectedIds.filter((id) => visibleIds.has(id));
    if (cleaned.length !== selectedIds.length) {
      onChange(cleaned);
    }
  }, [filteredPeriods]);

  // Group filtered periods by month
  const monthGroups = useMemo(() => {
    const groups = new Map<string, ProjectExpensePeriod[]>();
    const sorted = [...filteredPeriods].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    for (const p of sorted) {
      const key = getMonthKey(p.weekStart);
      const group = groups.get(key) || [];
      group.push(p);
      groups.set(key, group);
    }
    return groups;
  }, [filteredPeriods]);

  // Auto-expand first month when filtered periods change
  useEffect(() => {
    const keys = Array.from(monthGroups.keys());
    if (keys.length > 0) {
      setExpandedMonths(new Set([keys[0]]));
    }
  }, [monthGroups]);

  function applyPreset(preset: RangePreset) {
    const range = getPresetRange(preset, periods);
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(preset);
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    setActivePreset(null);
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    setActivePreset(null);
  }

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  function toggleMonth(monthKey: string) {
    const ids = monthGroups.get(monthKey)?.map((p) => p.id) || [];
    const allSelected = ids.every((id) => selectedSet.has(id));
    const next = new Set(selectedSet);
    if (allSelected) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    onChange(Array.from(next));
  }

  function toggleExpand(monthKey: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  }

  function selectAllVisible() {
    onChange(filteredPeriods.map((p) => p.id));
  }

  if (periods.length === 0) {
    return <p className="py-3 text-sm text-text-tertiary">{t('reports.noPeriodAvailable')}</p>;
  }

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'last-week', label: t('reports.lastWeek') },
    { key: 'last-month', label: t('reports.lastMonth') },
    { key: 'last-3-months', label: t('reports.last3Months') },
    { key: 'last-semester', label: t('reports.lastSemester') },
    { key: 'current-year', label: t('reports.currentYear') },
    { key: 'all', label: t('reports.allPeriod') },
  ];

  return (
    <div className="space-y-3">
      {/* Date range inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className={dateInputClass}
        />
        <span className="shrink-0 text-xs text-text-tertiary">a</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          className={dateInputClass}
        />
      </div>

      {/* Preset shortcuts */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className={activePreset === p.key ? chipActiveClass : chipClass}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Info bar: count + actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {filteredPeriods.length} semana{filteredPeriods.length !== 1 ? 's' : ''} no período
        </span>
        <div className="flex gap-2">
          {filteredPeriods.length > 0 && selectedIds.length < filteredPeriods.length && (
            <button type="button" onClick={selectAllVisible} className={chipClass}>
              Selecionar todas
            </button>
          )}
          {selectedIds.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="rounded-md bg-surface-3 px-2 py-1 text-xs text-danger hover:bg-danger-muted transition-colors">
              Limpar seleção
            </button>
          )}
        </div>
      </div>

      {/* Week multi-select list */}
      {filteredPeriods.length > 0 ? (
        <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
          {Array.from(monthGroups.entries()).map(([monthKey, monthPeriods]) => {
            const isExpanded = expandedMonths.has(monthKey);
            const allSelected = monthPeriods.every((p) => selectedSet.has(p.id));
            const someSelected = monthPeriods.some((p) => selectedSet.has(p.id));

            return (
              <div key={monthKey} className="border-b border-border last:border-b-0">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={() => toggleMonth(monthKey)}
                    className="rounded border-border"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpand(monthKey)}
                    className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary"
                  >
                    {formatMonthLabel(monthKey)}
                    <span className="ml-2 text-text-muted">({monthPeriods.length})</span>
                  </button>
                  <span className="text-xs text-text-muted">{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div className="space-y-0.5 px-2 py-1">
                    {monthPeriods.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(p.id)}
                          onChange={() => toggle(p.id)}
                          className="rounded border-border"
                        />
                        <span>{formatWeekRange(p.weekStart, p.weekEnd)}</span>
                        <span className={`ml-auto text-xs ${p.status === 'open' ? 'text-success' : 'text-text-muted'}`}>
                          {p.status === 'open' ? t('common.open') : t('expenses.statusClosed')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border px-4 py-6 text-center">
          <p className="text-sm text-text-tertiary">{t('reports.noWeeksFound')}</p>
          <button type="button" onClick={() => applyPreset('all')} className="mt-2 text-xs text-accent hover:underline">
            Ver todo o período
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <p className="text-xs text-text-tertiary">{selectedIds.length} semana{selectedIds.length > 1 ? 's' : ''} selecionada{selectedIds.length > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
