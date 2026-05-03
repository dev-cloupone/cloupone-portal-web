import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { ExpenseMonthHeader } from '../components/expenses/expense-month-header';
import { ExpenseMonthCalendar } from '../components/expenses/expense-month-calendar';
import { ExpenseMonthSummary } from '../components/expenses/expense-month-summary';
import { ExpenseDayPanel } from '../components/expenses/expense-day-panel';
import { ExpenseForm } from '../components/expenses/expense-form';
import { ExpenseTemplatesManager } from '../components/expenses/expense-templates-manager';
import { ExpenseContextBar } from '../components/expenses/expense-context-bar';
import { useMonthExpenses } from '../hooks/use-month-expenses';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import * as expenseCategoryService from '../services/expense-category.service';
import * as projectExpenseCategoryService from '../services/project-expense-category.service';
import * as expenseTemplateService from '../services/expense-template.service';
import * as consultantService from '../services/consultant.service';
import * as projectService from '../services/project.service';
import type { ExpenseCategory, ProjectExpenseCategory, Expense, ExpenseTemplate } from '../types/expense.types';
import type { ProjectAllocation } from '../types/project.types';
import { Skeleton } from '../components/ui/skeleton';

type PanelState =
  | { view: 'month-summary' }
  | { view: 'day-expenses' }
  | { view: 'expense-form'; expense: Expense | null };

export default function ExpensesPage() {
  const navItems = useNavItems();
  const { user } = useAuth();

  const [globalCategories, setGlobalCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesByProject, setCategoriesByProject] = useState<Record<string, ProjectExpenseCategory[]>>({});
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [allocatedProjects, setAllocatedProjects] = useState<Array<{ projectId: string; projectName: string; clientName: string }>>([]);
  const [allocationsByProject, setAllocationsByProject] = useState<Record<string, ProjectAllocation[]>>({});

  const isGestorOrAdmin = user?.role === 'gestor' || user?.role === 'super_admin';

  const [contextConsultantUserId, setContextConsultantUserId] = useState<string | null>(null);
  const [contextProjectId, setContextProjectId] = useState<string | null>(null);

  const projectIds = useMemo(() => allocatedProjects.map(p => p.projectId), [allocatedProjects]);

  const filters = useMemo(() => ({
    consultantUserId: contextConsultantUserId ?? undefined,
    projectId: contextProjectId ?? undefined,
    periodScopeProjectId: contextProjectId ?? undefined,
  }), [contextConsultantUserId, contextProjectId]);

  const {
    currentMonthStr, monthData, selectedDate, isLoading,
    calendarDays, selectedDayExpenses, selectedWeekSummary, weekSummaries, getDatePeriodStatus, getOpenProjectIdsForDate,
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    saveExpense, deleteExpense, resubmitExpense, revertExpense,
  } = useMonthExpenses(projectIds, filters);

  const [panelState, setPanelState] = useState<PanelState>({ view: 'month-summary' });

  // Templates manager
  const [isTemplatesManagerOpen, setIsTemplatesManagerOpen] = useState(false);

  const loadTemplates = useCallback(() => {
    expenseTemplateService.listTemplates().then((res) => setTemplates(res.data)).catch(() => {});
  }, []);

  // Load global categories (for templates manager), templates, and allocated projects
  useEffect(() => {
    expenseCategoryService.listCategories().then((res) => setGlobalCategories(res.data)).catch(() => {});
    loadTemplates();
    if (user) {
      if (user.role === 'super_admin') {
        // Super admin sees all active projects
        projectService.listProjects({ limit: 100 }).then((res) => {
          setAllocatedProjects(res.data.map(p => ({
            projectId: p.id,
            projectName: p.name,
            clientName: p.clientName ?? '',
          })));
        }).catch(console.error);
      } else {
        consultantService.listConsultantProjects(user.id).then((res) => setAllocatedProjects(res.data)).catch(() => {});
      }
    }
  }, [user, loadTemplates]);

  // Lazy-load categories and allocations per project (on demand, not all at once)
  const loadProjectCategories = useCallback(async (pid: string) => {
    if (categoriesByProject[pid]) return;
    try {
      const res = await projectExpenseCategoryService.listByProject(pid);
      setCategoriesByProject(prev => ({ ...prev, [pid]: res.data }));
    } catch { /* silent */ }
  }, [categoriesByProject]);

  const loadedAllocationsRef = useRef<Set<string>>(new Set());
  const loadProjectAllocations = useCallback(async (pid: string) => {
    if (!isGestorOrAdmin || loadedAllocationsRef.current.has(pid)) return;
    loadedAllocationsRef.current.add(pid);
    try {
      const res = await projectService.listAllocations(pid);
      setAllocationsByProject(prev => ({ ...prev, [pid]: res.data }));
    } catch { /* silent */ }
  }, [isGestorOrAdmin]);

  // Pre-load categories for the context project or when there's only 1 project
  useEffect(() => {
    const pid = contextProjectId || (allocatedProjects.length === 1 ? allocatedProjects[0].projectId : null);
    if (pid) {
      loadProjectCategories(pid);
    }
  }, [contextProjectId, allocatedProjects, loadProjectCategories]);

  // Pre-load allocations for ALL projects so the consultant filter is populated
  useEffect(() => {
    if (isGestorOrAdmin && allocatedProjects.length > 0) {
      allocatedProjects.forEach(p => loadProjectAllocations(p.projectId));
    }
  }, [isGestorOrAdmin, allocatedProjects, loadProjectAllocations]);

  // Panel state handlers
  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setPanelState({ view: 'day-expenses' });
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
    setPanelState({ view: 'day-expenses' });
  }

  return (
    <SidebarLayout navItems={navItems} title="Despesas">
      <div className="space-y-4">
        <ExpenseMonthHeader
          currentMonthStr={currentMonthStr}
          monthData={monthData}
          selectedWeekSummary={selectedWeekSummary}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleGoToToday}
        />

        {isGestorOrAdmin && (
          <ExpenseContextBar
            selectedConsultantUserId={contextConsultantUserId}
            selectedProjectId={contextProjectId}
            onConsultantChange={(id) => {
              setContextConsultantUserId(id);
              setContextProjectId(null);
            }}
            onProjectChange={setContextProjectId}
            allocatedProjects={allocatedProjects}
            allocationsByProject={allocationsByProject}
          />
        )}

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
              <ExpenseMonthCalendar
                calendarDays={calendarDays}
                selectedDate={selectedDate}
                selectedWeekStart={selectedWeekSummary?.weekStart ?? null}
                onSelectDate={handleSelectDate}
              />
            )}
          </div>

          {/* Side Panel */}
          <div className="lg:w-[35%] w-full">
            {panelState.view === 'month-summary' && monthData && (
              <ExpenseMonthSummary monthData={monthData} weekSummaries={weekSummaries} />
            )}
            {panelState.view === 'day-expenses' && selectedDate && (
              <ExpenseDayPanel
                selectedDate={selectedDate}
                expenses={selectedDayExpenses}
                weekSummary={selectedWeekSummary}
                isDayInOpenPeriod={getDatePeriodStatus(selectedDate, contextProjectId ?? undefined) === 'open'}
                onEdit={(expense) => setPanelState({ view: 'expense-form', expense })}
                onDelete={deleteExpense}
                onResubmit={resubmitExpense}
                onRevertExpense={isGestorOrAdmin ? revertExpense : undefined}
                onNewExpense={() => setPanelState({ view: 'expense-form', expense: null })}
                onClose={handleClosePanel}
              />
            )}
            {panelState.view === 'expense-form' && selectedDate && (
              <ExpenseForm
                date={selectedDate}
                expense={panelState.expense}
                projects={allocatedProjects}
                categoriesByProject={categoriesByProject}
                allocationsByProject={allocationsByProject}
                templates={templates}
                openProjectIds={getOpenProjectIdsForDate(selectedDate)}
                contextConsultantUserId={contextConsultantUserId}
                contextProjectId={contextProjectId}
                onProjectChange={(pid) => { loadProjectCategories(pid); loadProjectAllocations(pid); }}
                onSave={async (data) => {
                  await saveExpense(data);
                  setPanelState({ view: 'day-expenses' });
                }}
                onManageTemplates={() => setIsTemplatesManagerOpen(true)}
                onCancel={() => setPanelState({ view: 'day-expenses' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Templates Manager */}
      <ExpenseTemplatesManager
        isOpen={isTemplatesManagerOpen}
        onClose={() => setIsTemplatesManagerOpen(false)}
        templates={templates}
        categories={globalCategories}
        onCreate={async (data) => {
          await expenseTemplateService.createTemplate(data);
          loadTemplates();
        }}
        onUpdate={async (id, data) => {
          await expenseTemplateService.updateTemplate(id, data);
          loadTemplates();
        }}
        onDelete={async (id) => {
          await expenseTemplateService.deleteTemplate(id);
          loadTemplates();
        }}
      />
    </SidebarLayout>
  );
}
