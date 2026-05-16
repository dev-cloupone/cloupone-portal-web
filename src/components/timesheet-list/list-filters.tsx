import { Select } from '../ui/select';
import { Button } from '../ui/button';
import type { ConsultantOption } from '../../types/time-entry.types';

interface ListFiltersProps {
  filters: {
    consultantId?: string;
    projectId?: string;
    all?: boolean;
  };
  onFilterChange: (filters: Record<string, string | boolean | undefined>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  showConsultantFilter: boolean;
  consultants: ConsultantOption[];
  projects: { id: string; name: string }[];
}

export function ListFilters({
  filters,
  onFilterChange,
  onClear,
  hasActiveFilters,
  showConsultantFilter,
  consultants,
  projects,
}: ListFiltersProps) {
  const consultantOptions = [
    { value: '', label: 'Meus apontamentos' },
    { value: '__all__', label: 'Todos' },
    ...consultants.map(c => ({ value: c.id, label: c.name })),
  ];

  const projectOptions = [
    { value: '', label: 'Todos os projetos' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ];

  const handleConsultantChange = (value: string) => {
    if (value === '__all__') {
      onFilterChange({ consultantId: undefined, all: true });
    } else if (value === '') {
      onFilterChange({ consultantId: undefined, all: undefined });
    } else {
      onFilterChange({ consultantId: value, all: undefined });
    }
  };

  const consultantValue = filters.all ? '__all__' : (filters.consultantId || '');

  return (
    <div className="flex flex-wrap items-end gap-3">
      {showConsultantFilter && (
        <div className="min-w-[180px]">
          <Select
            label="Consultor"
            options={consultantOptions}
            value={consultantValue}
            onChange={handleConsultantChange}
          />
        </div>
      )}
      <div className="min-w-[180px]">
        <Select
          label="Projeto"
          options={projectOptions}
          value={filters.projectId || ''}
          onChange={(value) => onFilterChange({ projectId: value || undefined })}
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
