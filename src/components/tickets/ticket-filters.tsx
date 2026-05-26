import { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import {
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
} from '../../types/ticket.types';
import type { ConsultantOption } from '../../types/time-entry.types';

interface ProjectOption {
  id: string;
  name: string;
}

export interface TicketFilterValues {
  projectId: string;
  status: string;
  type: string;
  priority: string;
  search: string;
  assignedTo: string;
}

interface TicketFiltersProps {
  values: TicketFilterValues;
  onChange: (values: TicketFilterValues) => void;
  projects: ProjectOption[];
  consultants?: ConsultantOption[];
  showConsultantFilter?: boolean;
}

const statusOptions = [
  { value: 'active', label: 'Não finalizados' },
  { value: 'all', label: 'Todos os status' },
  ...Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const typeOptions = [
  { value: '', label: 'Todos os tipos' },
  ...Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const priorityOptions = [
  { value: '', label: 'Todas as prioridades' },
  ...Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];

const emptyFilters: TicketFilterValues = {
  projectId: '',
  status: 'active',
  type: '',
  priority: '',
  search: '',
  assignedTo: '',
};

function hasActiveFilters(values: TicketFilterValues): boolean {
  return (
    values.projectId !== '' ||
    values.type !== '' ||
    values.priority !== '' ||
    values.search !== '' ||
    values.status !== 'active' ||
    values.assignedTo !== ''
  );
}

function countActiveSelectFilters(values: TicketFilterValues): number {
  let count = 0;
  if (values.projectId) count++;
  if (values.status !== 'active') count++;
  if (values.type) count++;
  if (values.priority) count++;
  if (values.assignedTo) count++;
  return count;
}

export function TicketFilters({ values, onChange, projects, consultants, showConsultantFilter }: TicketFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const projectOptions = [
    { value: '', label: 'Todos os projetos' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const consultantOptions = [
    { value: '', label: 'Todos os consultores' },
    ...(consultants || []).map((c) => ({ value: c.id, label: c.name })),
  ];

  const activeCount = countActiveSelectFilters(values);

  function handleChange(field: keyof TicketFilterValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function toggleExpanded() {
    setExpanded((prev) => !prev);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Search size={16} />
          </div>
          <Input
            placeholder="Buscar tickets..."
            value={values.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        <button
          type="button"
          onClick={toggleExpanded}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {hasActiveFilters(values) && (
          <button
            type="button"
            onClick={() => onChange(emptyFilters)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Select
            options={projectOptions}
            value={values.projectId}
            onChange={(value) => handleChange('projectId', value)}
          />

          <Select
            options={statusOptions}
            value={values.status}
            onChange={(value) => handleChange('status', value)}
          />

          <Select
            options={typeOptions}
            value={values.type}
            onChange={(value) => handleChange('type', value)}
          />

          <Select
            options={priorityOptions}
            value={values.priority}
            onChange={(value) => handleChange('priority', value)}
          />

          {showConsultantFilter && (
            <Select
              options={consultantOptions}
              value={values.assignedTo}
              onChange={(value) => handleChange('assignedTo', value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
