import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const consultantOptions = [
    { value: '', label: t('timesheet.myEntries') },
    { value: '__all__', label: t('timesheet.allEntries') },
    ...consultants.map(c => ({ value: c.id, label: c.name })),
  ];

  const projectOptions = [
    { value: '', label: t('timesheet.allProjects') },
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
            label={t('common.consultant')}
            options={consultantOptions}
            value={consultantValue}
            onChange={handleConsultantChange}
          />
        </div>
      )}
      <div className="min-w-[180px]">
        <Select
          label={t('common.project')}
          options={projectOptions}
          value={filters.projectId || ''}
          onChange={(value) => onFilterChange({ projectId: value || undefined })}
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('timesheet.clearFilters')}
        </Button>
      )}
    </div>
  );
}
