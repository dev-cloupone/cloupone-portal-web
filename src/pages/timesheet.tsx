import { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { MonthHeader } from '../components/timesheet/month-header';
import { MonthCalendar } from '../components/timesheet/month-calendar';
import { MonthSummary } from '../components/timesheet/month-summary';
import { DayPanel } from '../components/timesheet/day-panel';
import { InlineEntryForm } from '../components/timesheet/inline-entry-form';
import { SubmitDialog } from '../components/timesheet/submit-dialog';
import { SubmitEntryDialog } from '../components/timesheet/submit-entry-dialog';
import { useMonthTimesheet } from '../hooks/use-month-timesheet';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import * as activityCategoryService from '../services/activity-category.service';
import * as consultantService from '../services/consultant.service';
import type { ActivityCategory } from '../types/activity-category.types';
import type { TimeEntry } from '../types/time-entry.types';
import { Skeleton } from '../components/ui/skeleton';

type PanelState =
  | { view: 'month-summary' }
  | { view: 'day-entries' }
  | { view: 'entry-form'; entry: TimeEntry | null };

export default function TimesheetPage() {
  const navItems = useNavItems();
  const { user } = useAuth();
  const {
    currentMonth, monthData, selectedDate, isLoading,
    calendarDays, selectedDayEntries, selectedWeekSummary, weekSummaries,
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    saveEntry, deleteEntry, submitEntry, submitWeek,
  } = useMonthTimesheet();

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [allocatedProjects, setAllocatedProjects] = useState<Array<{ projectId: string; projectName: string; clientName: string }>>([]);
  const [panelState, setPanelState] = useState<PanelState>({ view: 'month-summary' });

  // Submit dialog
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit entry dialog
  const [submitEntryDialog, setSubmitEntryDialog] = useState<{ entryId: string } | null>(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // Load categories and allocated projects
  useEffect(() => {
    activityCategoryService.listCategories().then((res) => setCategories(res.data)).catch(() => {});
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

  async function handleSubmitWeek() {
    if (!selectedWeekSummary) return;
    setIsSubmitting(true);
    try {
      await submitWeek(selectedWeekSummary.weekStartDate);
      setIsSubmitOpen(false);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }

  // Existing entries for time suggestion in form
  const existingEntriesForForm = selectedDate
    ? monthData?.entries.filter(e => e.date === selectedDate && e.id !== (panelState.view === 'entry-form' ? panelState.entry?.id : undefined)) ?? []
    : [];

  const draftEntryCount = selectedWeekSummary?.entries.filter(e => e.status === 'draft').length ?? 0;

  return (
    <SidebarLayout navItems={navItems} title="Apontamento">
      <div className="space-y-4">
        <MonthHeader
          currentMonth={currentMonth}
          monthData={monthData}
          selectedWeekSummary={selectedWeekSummary}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleGoToToday}
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
              <MonthSummary monthData={monthData} weekSummaries={weekSummaries} />
            )}
            {panelState.view === 'day-entries' && selectedDate && (
              <DayPanel
                selectedDate={selectedDate}
                entries={selectedDayEntries}
                weekSummary={selectedWeekSummary}

                onEdit={(entry) => setPanelState({ view: 'entry-form', entry })}
                onDelete={deleteEntry}
                onNewEntry={() => setPanelState({ view: 'entry-form', entry: null })}
                onSubmitWeek={() => setIsSubmitOpen(true)}
                onClose={handleClosePanel}
              />
            )}
            {panelState.view === 'entry-form' && selectedDate && (
              <InlineEntryForm
                date={selectedDate}
                entry={panelState.entry}
                projects={allocatedProjects}
                categories={categories}
                existingEntries={existingEntriesForForm}
                onSave={async (data) => {
                  const result = await saveEntry(data);
                  setPanelState({ view: 'day-entries' });
                  if (result?.id) {
                    setSubmitEntryDialog({ entryId: result.id });
                  }
                }}
                onCancel={() => setPanelState({ view: 'day-entries' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Submit Entry Dialog */}
      <SubmitEntryDialog
        isOpen={!!submitEntryDialog}
        loading={isSubmittingEntry}
        onSubmit={async () => {
          if (!submitEntryDialog) return;
          setIsSubmittingEntry(true);
          try {
            await submitEntry(submitEntryDialog.entryId);
            setSubmitEntryDialog(null);
          } catch {
            // Error handled in hook
          } finally {
            setIsSubmittingEntry(false);
          }
        }}
        onKeepDraft={() => setSubmitEntryDialog(null)}
      />

      {/* Submit Dialog */}
      <SubmitDialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onConfirm={handleSubmitWeek}
        totalHours={selectedWeekSummary?.totalHours ?? 0}
        targetHours={selectedWeekSummary?.targetHours ?? 40}
        entryCount={draftEntryCount}
        isSubmitting={isSubmitting}
      />
    </SidebarLayout>
  );
}
