import { useTimesheetList } from '../hooks/use-timesheet-list';
import { ListFilters } from '../components/timesheet-list/list-filters';
import { ListTable } from '../components/timesheet-list/list-table';
import { ExportButtons } from '../components/timesheet-list/export-buttons';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { useNavItems } from '../hooks/use-nav-items';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TimesheetListPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const {
    currentMonth, entries, totalHours, loading, filtering,
    filters, updateFilters, clearFilters, hasActiveFilters,
    consultants, projects,
    goToPreviousMonth, goToNextMonth, goToToday,
    isAdminOrGestor,
    user,
  } = useTimesheetList();

  const monthLabel = formatMonthLabel(currentMonth);
  const selectedProjectName = filters.projectId ? projects.find(p => p.id === filters.projectId)?.name : undefined;
  const selectedConsultantName = filters.consultantId ? consultants.find(c => c.id === filters.consultantId)?.name : undefined;


  return (
    <SidebarLayout navItems={navItems} title="Apontamentos - Lista">
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth} aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </Button>
            <h1 className="text-lg font-semibold text-text-primary capitalize min-w-[160px] text-center">
              {monthLabel}
            </h1>
            <Button variant="ghost" size="sm" onClick={goToNextMonth} aria-label="Próximo mês">
              <ChevronRight size={16} />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>Hoje</Button>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons
              entries={entries}
              totalHours={totalHours}
              currentMonth={currentMonth}
              consultantName={filters.all ? undefined : (selectedConsultantName || user?.name)}
              projectName={selectedProjectName}
              showConsultantColumn={isAdminOrGestor}
              disabled={loading || entries.length === 0}
            />
            <Button variant="ghost" size="sm" onClick={() => navigate('/timesheet')}>
              <Calendar className="w-4 h-4 mr-1" /> Calendário
            </Button>
          </div>
        </header>

        {/* Filters */}
        <ListFilters
          filters={filters}
          onFilterChange={updateFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          showConsultantFilter={isAdminOrGestor}
          consultants={consultants}
          projects={projects}
        />

        {/* Table */}
        <ListTable
          entries={entries}
          totalHours={totalHours}
          loading={loading}
          filtering={filtering}
          showConsultantColumn={isAdminOrGestor}
        />
      </div>
    </SidebarLayout>
  );
}
