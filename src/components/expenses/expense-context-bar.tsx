import { useMemo } from 'react';
import { Select } from '../ui/select';
import type { ProjectAllocation } from '../../types/project.types';
import { useAuth } from '../../hooks/use-auth';

interface ExpenseContextBarProps {
  selectedConsultantUserId: string | null;
  selectedProjectId: string | null;
  onConsultantChange: (userId: string | null) => void;
  onProjectChange: (projectId: string | null) => void;
  allocatedProjects: Array<{ projectId: string; projectName: string; clientName: string }>;
  allocationsByProject: Record<string, ProjectAllocation[]>;
}

export function ExpenseContextBar({
  selectedConsultantUserId,
  selectedProjectId,
  onConsultantChange,
  onProjectChange,
  allocatedProjects,
  allocationsByProject,
}: ExpenseContextBarProps) {
  const { user } = useAuth();

  // Extract unique consultants from all project allocations (excluding current user)
  const consultantOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const allocations of Object.values(allocationsByProject)) {
      for (const alloc of allocations) {
        if (alloc.userId !== user?.id && !seen.has(alloc.userId)) {
          seen.set(alloc.userId, alloc.userName);
        }
      }
    }
    return [
      { value: '', label: 'Minhas despesas' },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ value: id, label: name })),
    ];
  }, [allocationsByProject, user?.id]);

  // Filter projects where the selected consultant is allocated
  const projectOptions = useMemo(() => {
    if (!selectedConsultantUserId) return [];
    return allocatedProjects
      .filter((p) => {
        const allocs = allocationsByProject[p.projectId] ?? [];
        return allocs.some((a) => a.userId === selectedConsultantUserId);
      })
      .map((p) => ({
        value: p.projectId,
        label: `${p.projectName}${p.clientName ? ` — ${p.clientName}` : ''}`,
      }));
  }, [selectedConsultantUserId, allocatedProjects, allocationsByProject]);

  const selectedConsultantName = consultantOptions.find(
    (o) => o.value === selectedConsultantUserId,
  )?.label;

  const selectedProjectName = projectOptions.find(
    (o) => o.value === selectedProjectId,
  )?.label;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select
            label="Visualizar como"
            options={consultantOptions}
            value={selectedConsultantUserId ?? ''}
            onChange={(val) => onConsultantChange(val || null)}
          />
        </div>
        {selectedConsultantUserId && (
          <div className="w-72">
            <Select
              label="Projeto"
              options={projectOptions}
              value={selectedProjectId ?? ''}
              onChange={(val) => onProjectChange(val || null)}
              placeholder="Selecione um projeto"
            />
          </div>
        )}
      </div>
      {selectedConsultantUserId && selectedProjectId && selectedConsultantName && selectedProjectName && (
        <p className="text-xs text-text-muted">
          Despesas de <span className="font-semibold text-text-primary">{selectedConsultantName}</span> — {selectedProjectName}
        </p>
      )}
    </div>
  );
}
