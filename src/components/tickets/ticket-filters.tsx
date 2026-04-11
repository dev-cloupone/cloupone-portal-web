import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import {
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
} from '../../types/ticket.types';

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
}

interface TicketFiltersProps {
  values: TicketFilterValues;
  onChange: (values: TicketFilterValues) => void;
  projects: ProjectOption[];
}

const statusOptions = [
  { value: 'active', label: 'Nao finalizados' },
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
};

function hasActiveFilters(values: TicketFilterValues): boolean {
  return (
    values.projectId !== '' ||
    values.type !== '' ||
    values.priority !== '' ||
    values.search !== '' ||
    values.status !== 'active'
  );
}

export function TicketFilters({ values, onChange, projects }: TicketFiltersProps) {
  const projectOptions = [
    { value: '', label: 'Todos os projetos' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  function handleChange(field: keyof TicketFilterValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
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
      </div>

      {hasActiveFilters(values) && (
        <button
          type="button"
          onClick={() => onChange(emptyFilters)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3"
        >
          <X size={14} />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
