import { useState } from 'react';
import { useTimesheetList } from '../hooks/use-timesheet-list';
import { ListFilters } from '../components/timesheet-list/list-filters';
import { ListTable } from '../components/timesheet-list/list-table';
import { ExportButtons } from '../components/timesheet-list/export-buttons';
import { ImportModal } from '../components/timesheet-list/import-modal';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { MonthNavigator } from '../components/ui/month-navigator';
import { useNavItems } from '../hooks/use-nav-items';
import { Calendar, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router';

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
    refetch,
  } = useTimesheetList();
  const [showImportModal, setShowImportModal] = useState(false);

  const selectedProjectName = filters.projectId ? projects.find(p => p.id === filters.projectId)?.name : undefined;
  const selectedConsultantName = filters.consultantId ? consultants.find(c => c.id === filters.consultantId)?.name : undefined;


  return (
    <SidebarLayout navItems={navItems} title="Apontamentos - Lista">
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <MonthNavigator
            currentMonth={currentMonth}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
          />
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
            <Button variant="ghost" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
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

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={refetch}
        consultants={consultants}
        isAdminOrGestor={isAdminOrGestor}
        userId={user!.id}
      />
    </SidebarLayout>
  );
}
