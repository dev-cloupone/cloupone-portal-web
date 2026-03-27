import { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { ExpenseMonthHeader } from '../components/expenses/expense-month-header';
import { ExpenseMonthCalendar } from '../components/expenses/expense-month-calendar';
import { ExpenseMonthSummary } from '../components/expenses/expense-month-summary';
import { ExpenseDayPanel } from '../components/expenses/expense-day-panel';
import { ExpenseForm } from '../components/expenses/expense-form';
import { ExpenseSubmitDialog } from '../components/expenses/expense-submit-dialog';
import { ExpenseTemplatesManager } from '../components/expenses/expense-templates-manager';
import { useMonthExpenses } from '../hooks/use-month-expenses';
import { useNavItems } from '../hooks/use-nav-items';
import { useAuth } from '../hooks/use-auth';
import * as expenseCategoryService from '../services/expense-category.service';
import * as expenseTemplateService from '../services/expense-template.service';
import * as consultantService from '../services/consultant.service';
import type { ExpenseCategory, Expense, ExpenseTemplate } from '../types/expense.types';
import { Skeleton } from '../components/ui/skeleton';

type PanelState =
  | { view: 'month-summary' }
  | { view: 'day-expenses' }
  | { view: 'expense-form'; expense: Expense | null };

export default function ExpensesPage() {
  const navItems = useNavItems();
  const { user } = useAuth();
  const {
    currentMonthStr, monthData, selectedDate, isLoading,
    calendarDays, selectedDayExpenses, selectedWeekSummary, weekSummaries,
    setSelectedDate, goToPreviousMonth, goToNextMonth, goToCurrentMonth,
    saveExpense, deleteExpense, submitWeek, resubmitExpense,
  } = useMonthExpenses();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [allocatedProjects, setAllocatedProjects] = useState<Array<{ projectId: string; projectName: string; clientName: string }>>([]);
  const [panelState, setPanelState] = useState<PanelState>({ view: 'month-summary' });

  // Submit dialog
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Templates manager
  const [isTemplatesManagerOpen, setIsTemplatesManagerOpen] = useState(false);

  const loadTemplates = useCallback(() => {
    expenseTemplateService.listTemplates().then((res) => setTemplates(res.data)).catch(() => {});
  }, []);

  // Load categories, templates, and allocated projects
  useEffect(() => {
    expenseCategoryService.listCategories().then((res) => setCategories(res.data)).catch(() => {});
    loadTemplates();
    if (user) {
      consultantService.listConsultantProjects(user.id).then((res) => setAllocatedProjects(res.data)).catch(() => {});
    }
  }, [user, loadTemplates]);

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

  async function handleSubmitWeek() {
    if (!selectedWeekSummary) return;
    setIsSubmitting(true);
    try {
      await submitWeek(selectedWeekSummary.weekStart);
      setIsSubmitOpen(false);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }

  // Draft expenses for submit dialog
  const draftExpenses = useMemo(() => {
    if (!selectedWeekSummary || !monthData) return [];
    return monthData.expenses.filter(e =>
      e.date >= selectedWeekSummary.weekStart &&
      e.date <= selectedWeekSummary.weekEnd &&
      e.status === 'draft'
    );
  }, [selectedWeekSummary, monthData]);

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
                onEdit={(expense) => setPanelState({ view: 'expense-form', expense })}
                onDelete={deleteExpense}
                onResubmit={resubmitExpense}
                onNewExpense={() => setPanelState({ view: 'expense-form', expense: null })}
                onSubmitWeek={() => setIsSubmitOpen(true)}
                onClose={handleClosePanel}
              />
            )}
            {panelState.view === 'expense-form' && selectedDate && (
              <ExpenseForm
                date={selectedDate}
                expense={panelState.expense}
                projects={allocatedProjects}
                categories={categories}
                templates={templates}
                onSave={async (data) => {
                  await saveExpense(data);
                  setPanelState({ view: 'day-expenses' });
                }}
                onSaveAsTemplate={async (data) => {
                  await expenseTemplateService.createTemplate(data);
                  loadTemplates();
                }}
                onManageTemplates={() => setIsTemplatesManagerOpen(true)}
                onCancel={() => setPanelState({ view: 'day-expenses' })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <ExpenseSubmitDialog
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onConfirm={handleSubmitWeek}
        weekSummary={selectedWeekSummary}
        draftExpenses={draftExpenses}
        isSubmitting={isSubmitting}
      />

      {/* Templates Manager */}
      <ExpenseTemplatesManager
        isOpen={isTemplatesManagerOpen}
        onClose={() => setIsTemplatesManagerOpen(false)}
        templates={templates}
        categories={categories}
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
