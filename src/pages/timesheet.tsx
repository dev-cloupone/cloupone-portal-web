import { useState, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { WeekHeader } from '../components/timesheet/week-header';
import { DayEntryList } from '../components/timesheet/day-entry-list';
import { DayCards } from '../components/timesheet/day-cards';
import { EntryEditor } from '../components/timesheet/entry-editor';
import { SubmitDialog } from '../components/timesheet/submit-dialog';
import { useTimesheet } from '../hooks/use-timesheet';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import { useMobile } from '../hooks/use-mobile';
import * as activityCategoryService from '../services/activity-category.service';
import * as consultantService from '../services/consultant.service';
import type { ActivityCategory } from '../types/activity-category.types';
import type { TimeEntry, UpsertEntryData } from '../types/time-entry.types';
import { Skeleton } from '../components/ui/skeleton';

export default function TimesheetPage() {
  const navItems = useNavItems();
  const { user } = useAuth();
  const isMobile = useMobile();
  const {
    weekData,
    isLoading,
    currentWeekStart,
    dayGroups,
    hasDraftEntries,
    weekStatus,
    saveEntry,
    deleteEntry,
    submitWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useTimesheet();

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [allocatedProjects, setAllocatedProjects] = useState<Array<{ projectId: string; projectName: string; clientName: string }>>([]);

  // Editor modal state
  const [editorState, setEditorState] = useState<{
    entry: TimeEntry | null;
    date: string;
  } | null>(null);

  // Submit dialog
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories and allocated projects
  useEffect(() => {
    activityCategoryService.listCategories().then((res) => setCategories(res.data)).catch(() => {});
    if (user) {
      consultantService.listConsultantProjects(user.id).then((res) => setAllocatedProjects(res.data)).catch(() => {});
    }
  }, [user]);

  const handleEditEntry = useCallback((entry: TimeEntry) => {
    setEditorState({ entry, date: entry.date });
  }, []);

  const handleAddEntry = useCallback((date: string) => {
    setEditorState({ entry: null, date });
  }, []);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    await deleteEntry(entryId);
  }, [deleteEntry]);

  const handleEditorSave = useCallback(async (data: UpsertEntryData) => {
    await saveEntry(data);
  }, [saveEntry]);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await submitWeek();
      setIsSubmitOpen(false);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get existing entries for the date being edited (for time suggestion)
  const existingEntriesForDate = editorState
    ? weekData?.entries.filter((e) => e.date === editorState.date && e.id !== editorState.entry?.id) ?? []
    : [];

  const isReadonly = weekStatus === 'submitted' || weekStatus === 'approved';
  const draftEntryCount = weekData?.entries.filter((e) => e.status === 'draft').length ?? 0;

  return (
    <SidebarLayout navItems={navItems} title="Apontamento">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Apontamento de Horas</h2>
          <div className="flex items-center gap-2">
            {hasDraftEntries && (
              <Button size="sm" onClick={() => setIsSubmitOpen(true)}>
                <Send size={14} className="mr-1" /> Submeter
              </Button>
            )}
          </div>
        </div>

        <WeekHeader
          weekStartDate={currentWeekStart}
          totalHours={weekData?.totalHours ?? 0}
          targetHours={weekData?.targetHours ?? 40}
          weekStatus={weekStatus}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onToday={goToCurrentWeek}
        />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isMobile ? (
          <DayCards
            dayGroups={dayGroups}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onAddEntry={handleAddEntry}
            isReadonly={isReadonly}
          />
        ) : (
          <DayEntryList
            dayGroups={dayGroups}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onAddEntry={handleAddEntry}
            isReadonly={isReadonly}
          />
        )}
      </div>

      {/* Entry Editor Modal */}
      <EntryEditor
        entry={editorState?.entry ?? null}
        date={editorState?.date ?? ''}
        projects={allocatedProjects}
        categories={categories}
        isOpen={!!editorState}
        onClose={() => setEditorState(null)}
        onSave={handleEditorSave}
        existingEntries={existingEntriesForDate}
      />

      {/* Submit Dialog */}
      <SubmitDialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onConfirm={handleSubmit}
        totalHours={weekData?.totalHours ?? 0}
        targetHours={weekData?.targetHours ?? 40}
        entryCount={draftEntryCount}
        isSubmitting={isSubmitting}
      />
    </SidebarLayout>
  );
}
