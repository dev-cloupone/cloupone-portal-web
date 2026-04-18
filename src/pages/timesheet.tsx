import { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { MonthHeader } from '../components/timesheet/month-header';
import { MonthCalendar } from '../components/timesheet/month-calendar';
import { MonthSummary } from '../components/timesheet/month-summary';
import { DayPanel } from '../components/timesheet/day-panel';
import { InlineEntryForm } from '../components/timesheet/inline-entry-form';
import { PendingMonthsBanner } from '../components/timesheet/pending-months-banner';
import { ApproveMonthModal } from '../components/timesheet/approve-month-modal';
import { useMonthTimesheet } from '../hooks/use-month-timesheet';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import * as consultantService from '../services/consultant.service';
import type { TimeEntry } from '../types/time-entry.types';
import { Skeleton } from '../components/ui/skeleton';

type PanelState =
  | { view: 'month-summary' }
  | { view: 'day-entries' }
  | { view: 'entry-form'; entry: TimeEntry | null };

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function TimesheetPage() {
  const navItems = useNavItems();
  const { user } = useAuth();
  const {
    currentMonth, monthData, selectedDate, isLoading, pendingMonths,
    calendarDays, selectedDayEntries, selectedWeekSummary, weekSummaries,
    isMonthEditable, currentMonthStatus,
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth, goToMonth,
    saveEntry, deleteEntry, approveMonth,
  } = useMonthTimesheet();

  const [allocatedProjects, setAllocatedProjects] = useState<Array<{ projectId: string; projectName: string; clientName: string }>>([]);
  const [panelState, setPanelState] = useState<PanelState>({ view: 'month-summary' });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{ year: number; month: number } | null>(null);

  // Load categories and allocated projects
  useEffect(() => {
    if (user) {
      consultantService.listConsultantProjects(user.id).then((res) => setAllocatedProjects(res.data)).catch(() => {});
    }
  }, [user]);

  // Explicit panel state handlers (no useEffect to avoid race conditions)
  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setPanelState({ view: 'day-entries' });
  }

  function handleClosePanel() {
    setSelectedDate(null);
    setPanelState({ view: 'month-summary' });
  }

  function handlePreviousMonth() {
    goToPreviousMonth();
    setPanelState({ view: 'month-summary' });
  }

  function handleNextMonth() {
    goToNextMonth();
    setPanelState({ view: 'month-summary' });
  }

  function handleGoToToday() {
    goToCurrentMonth();
    setPanelState({ view: 'day-entries' });
  }

  function handleNavigateToMonth(year: number, month: number) {
    goToMonth(year, month);
    setPanelState({ view: 'month-summary' });
  }

  function handleOpenApproveModal(year: number, month: number) {
    setApproveTarget({ year, month });
    setShowApproveModal(true);
  }

  function handleApproveCurrentMonth() {
    const [yearStr, monthStr] = currentMonth.split('-');
    setApproveTarget({ year: parseInt(yearStr), month: parseInt(monthStr) });
    setShowApproveModal(true);
  }

  // Consultants can only approve past months; admins/gestors can approve anytime
  const isAdmin = user?.role === 'super_admin' || user?.role === 'gestor';

  function isMonthInPast(year: number, month: number): boolean {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  }

  const canApproveCurrentMonth = (() => {
    if (isAdmin) return true;
    const [yearStr, monthStr] = currentMonth.split('-');
    return isMonthInPast(parseInt(yearStr), parseInt(monthStr));
  })();

  // Existing entries for time suggestion in form
  const existingEntriesForForm = selectedDate
    ? monthData?.entries.filter(e => e.date === selectedDate && e.id !== (panelState.view === 'entry-form' ? panelState.entry?.id : undefined)) ?? []
    : [];

  // Approve modal data
  const approveMonthLabel = approveTarget ? `${MONTH_NAMES[approveTarget.month]}/${approveTarget.year}` : '';

  return (
    <SidebarLayout navItems={navItems} title="Apontamento">
      <div className="space-y-4">
        {/* Pending months banner */}
        <PendingMonthsBanner
          pendingMonths={pendingMonths}
          onApprove={handleOpenApproveModal}
          onNavigate={handleNavigateToMonth}
          canApproveMonth={isAdmin ? undefined : (year, month) => isMonthInPast(year, month)}
        />

        <MonthHeader
          currentMonth={currentMonth}
          monthData={monthData}
          monthStatus={currentMonthStatus}
          selectedWeekSummary={selectedWeekSummary}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleGoToToday}
          onApproveMonth={canApproveCurrentMonth ? handleApproveCurrentMonth : undefined}
        />

        {/* Split View: 65% calendar / 35% panel */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Calendar */}
          <div className="lg:w-[65%] w-full">
            {isLoading ? (
              <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </div>
            ) : (
              <MonthCalendar
                calendarDays={calendarDays}
                selectedDate={selectedDate}
                selectedWeekStart={selectedWeekSummary?.weekStartDate ?? null}
                onSelectDate={handleSelectDate}
              />
            )}
          </div>

          {/* Side Panel */}
          <div className="lg:w-[35%] w-full">
            {panelState.view === 'month-summary' && monthData && (
              <MonthSummary monthData={monthData} weekSummaries={weekSummaries} monthStatus={currentMonthStatus} />
            )}
            {panelState.view === 'day-entries' && selectedDate && (
              <DayPanel
                selectedDate={selectedDate}
                entries={selectedDayEntries}
                weekSummary={selectedWeekSummary}
                isEditable={isMonthEditable}
                onEdit={(entry) => setPanelState({ view: 'entry-form', entry })}
                onDelete={deleteEntry}
                onNewEntry={() => setPanelState({ view: 'entry-form', entry: null })}
                onClose={handleClosePanel}
              />
            )}
            {panelState.view === 'entry-form' && selectedDate && (
              <InlineEntryForm
                date={selectedDate}
                entry={panelState.entry}
                projects={allocatedProjects}
                existingEntries={existingEntriesForForm}
                onSave={async (data) => {
                  await saveEntry(data);
                  setPanelState({ view: 'day-entries' });
                }}
                onCancel={() => setPanelState({ view: 'day-entries' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Approve month modal */}
      <ApproveMonthModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={async () => {
          if (approveTarget && user) {
            await approveMonth(user.id, approveTarget.year, approveTarget.month);
          }
        }}
        monthLabel={approveMonthLabel}
        totalHours={monthData?.totalHours ?? 0}
        targetHours={monthData?.targetHours ?? 0}
        entryCount={monthData?.entries.length ?? 0}
      />
    </SidebarLayout>
  );
}
