import './i18n';
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
import { useLocaleStore } from './stores/locale.store';
import { ProtectedRoute } from './components/protected-route';
import { RoleGuard } from './components/role-guard';
import { DefaultRedirect } from './components/default-redirect';
import { LoadingFallback } from './components/ui/loading-fallback';
import { ToastContainer } from './components/ui/toast';

// Public pages (lazy)
const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password'));

// Authenticated pages (any role)
const ProfilePage = lazy(() => import('./pages/profile'));
const ChangePasswordFirstPage = lazy(() => import('./pages/change-password-first'));
const HomePage = lazy(() => import('./pages/home'));
const NotificationsPage = lazy(() => import('./pages/notifications'));

// Super Admin pages (lazy)
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/users'));
const AdminSettingsPage = lazy(() => import('./pages/admin/settings'));
const SettingsGeneralPage = lazy(() => import('./pages/admin/settings/general'));
const CompanyInfoPage = lazy(() => import('./pages/admin/settings/company-info'));
const BankAccountsPage = lazy(() => import('./pages/admin/settings/bank-accounts'));

// Admin entity pages (super_admin + gestor)
const AdminClientsPage = lazy(() => import('./pages/admin/clients'));
const AdminProjectsPage = lazy(() => import('./pages/admin/projects'));
const AdminConsultantsPage = lazy(() => import('./pages/admin/consultants'));
const AdminExpenseCategoriesPage = lazy(() => import('./pages/admin/expense-categories'));
const AdminProjectPhasesPage = lazy(() => import('./pages/admin/project-phases'));
const AdminProjectExpensesConfigPage = lazy(() => import('./pages/admin/project-expenses-config'));
const AdminProjectExpenseCategoriesConfigPage = lazy(() => import('./pages/admin/project-expense-categories-config'));

// Timesheet (consultor + gestor + super_admin)
const TimesheetPage = lazy(() => import('./pages/timesheet'));
const TimesheetListPage = lazy(() => import('./pages/timesheet-list'));

// Approvals (super_admin only)
const ApprovalsPage = lazy(() => import('./pages/approvals'));

// Expenses (consultor + gestor + super_admin)
const ExpensesPage = lazy(() => import('./pages/expenses'));

// Expense Approvals (super_admin only)
const ExpenseApprovalsPage = lazy(() => import('./pages/expense-approvals'));


// Dashboards
const ManagerDashboardPage = lazy(() => import('./pages/manager-dashboard'));
const ConsultantDashboardPage = lazy(() => import('./pages/consultant-dashboard'));

// Reports system (gestor + super_admin)
const ReportsPage = lazy(() => import('./pages/reports'));
const ExpenseReportNewPage = lazy(() => import('./pages/reports/expenses'));

// Project sub-pages
const AdminProjectHubPage = lazy(() => import('./pages/admin/project-hub'));
const AdminProjectGeneralPage = lazy(() => import('./pages/admin/project-general'));
const AdminProjectTeamPage = lazy(() => import('./pages/admin/project-team'));
const AdminProjectFinancialPage = lazy(() => import('./pages/admin/project-financial'));
const AdminProjectNotificationSettingsPage = lazy(() => import('./pages/admin/project-notification-settings'));

// Financial (super_admin + administrative)
const PaymentHoursListPage = lazy(() => import('./pages/financial/payment-hours-list'));
const PaymentHoursNewPage = lazy(() => import('./pages/financial/payment-hours-new'));
const PaymentHoursDetailPage = lazy(() => import('./pages/financial/payment-hours-detail'));
const PaymentExpensesListPage = lazy(() => import('./pages/financial/payment-expenses-list'));
const PaymentExpensesNewPage = lazy(() => import('./pages/financial/payment-expenses-new'));
const PaymentExpensesDetailPage = lazy(() => import('./pages/financial/payment-expenses-detail'));

// Invoice pages (super_admin + administrative)
const InvoiceServicesListPage = lazy(() => import('./pages/financial/invoice-services-list'));
const InvoiceServicesNewPage = lazy(() => import('./pages/financial/invoice-services-new'));
const InvoiceServicesDetailPage = lazy(() => import('./pages/financial/invoice-services-detail'));
const InvoiceExpensesListPage = lazy(() => import('./pages/financial/invoice-expenses-list'));
const InvoiceExpensesNewPage = lazy(() => import('./pages/financial/invoice-expenses-new'));
const InvoiceExpensesDetailPage = lazy(() => import('./pages/financial/invoice-expenses-detail'));

// My Payments (consultor + gestor)
const MyPaymentsHoursPage = lazy(() => import('./pages/my-payments-hours'));
const MyPaymentsExpensesPage = lazy(() => import('./pages/my-payments-expenses'));

// Tickets (all authenticated roles)
const TicketsPage = lazy(() => import('./pages/tickets'));
const TicketNewPage = lazy(() => import('./pages/ticket-new'));
const TicketDetailPage = lazy(() => import('./pages/ticket-detail'));

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);

  useEffect(() => {
    void initialize().then(() => {
      const user = useAuthStore.getState().user;
      useLocaleStore.getState().initialize(user?.locale);
    });
    initializeTheme();
  }, [initialize, initializeTheme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Authenticated Routes (any role) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password-first"
            element={
              <ProtectedRoute>
                <ChangePasswordFirstPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes (super_admin + gestor) */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin', 'gestor']}>
                  <Routes>
                    {/* super_admin only */}
                    <Route path="dashboard" element={<RoleGuard allowedRoles={['super_admin']}><AdminDashboardPage /></RoleGuard>} />
                    <Route path="users" element={<RoleGuard allowedRoles={['super_admin']}><AdminUsersPage /></RoleGuard>} />
                    <Route path="settings" element={<RoleGuard allowedRoles={['super_admin']}><AdminSettingsPage /></RoleGuard>}>
                      <Route index element={<SettingsGeneralPage />} />
                      <Route path="company-info" element={<CompanyInfoPage />} />
                      <Route path="bank-accounts" element={<BankAccountsPage />} />
                    </Route>
                    <Route path="clients" element={<RoleGuard allowedRoles={['super_admin']}><AdminClientsPage /></RoleGuard>} />
                    <Route path="consultants" element={<RoleGuard allowedRoles={['super_admin']}><AdminConsultantsPage /></RoleGuard>} />
                    <Route path="expense-categories" element={<RoleGuard allowedRoles={['super_admin']}><AdminExpenseCategoriesPage /></RoleGuard>} />
                    {/* super_admin + gestor */}
                    <Route path="projects" element={<AdminProjectsPage />} />
                    <Route path="projects/:id" element={<AdminProjectHubPage />} />
                    <Route path="projects/:id/general" element={<AdminProjectGeneralPage />} />
                    <Route path="projects/:id/phases" element={<AdminProjectPhasesPage />} />
                    <Route path="projects/:id/team" element={<AdminProjectTeamPage />} />
                    <Route path="projects/:id/financial" element={<RoleGuard allowedRoles={['super_admin']}><AdminProjectFinancialPage /></RoleGuard>} />
                    <Route path="projects/:id/expenses" element={<AdminProjectExpensesConfigPage />} />
                    <Route path="projects/:id/expense-categories" element={<AdminProjectExpenseCategoriesConfigPage />} />
                    <Route path="projects/:id/notifications" element={<RoleGuard allowedRoles={['super_admin']}><AdminProjectNotificationSettingsPage /></RoleGuard>} />
                  </Routes>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Timesheet (consultor + gestor + super_admin) */}
          <Route
            path="/timesheet"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor', 'super_admin']}>
                  <TimesheetPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet/list"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor', 'super_admin']}>
                  <TimesheetListPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Manager Dashboard (gestor + super_admin) */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <ManagerDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Consultant Dashboard */}
          <Route
            path="/consultant-dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor', 'super_admin']}>
                  <ConsultantDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Approvals (super_admin only) */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <ApprovalsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Expenses (consultor + gestor + super_admin) */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor', 'super_admin']}>
                  <ExpensesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Expense Approvals (super_admin only) */}
          <Route
            path="/expense-approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <ExpenseApprovalsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />


          {/* Reports system (gestor + super_admin) */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin', 'gestor']}>
                  <ReportsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/expenses"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin', 'gestor']}>
                  <ExpenseReportNewPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Financial (super_admin + administrative) */}
          <Route
            path="/financial/*"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin', 'administrative']}>
                  <Routes>
                    <Route path="payments/hours" element={<PaymentHoursListPage />} />
                    <Route path="payments/hours/new" element={<PaymentHoursNewPage />} />
                    <Route path="payments/hours/:id" element={<PaymentHoursDetailPage />} />
                    <Route path="payments/expenses" element={<PaymentExpensesListPage />} />
                    <Route path="payments/expenses/new" element={<PaymentExpensesNewPage />} />
                    <Route path="payments/expenses/:id" element={<PaymentExpensesDetailPage />} />
                    <Route path="invoices/services" element={<InvoiceServicesListPage />} />
                    <Route path="invoices/services/new" element={<InvoiceServicesNewPage />} />
                    <Route path="invoices/services/:id" element={<InvoiceServicesDetailPage />} />
                    <Route path="invoices/expenses" element={<InvoiceExpensesListPage />} />
                    <Route path="invoices/expenses/new" element={<InvoiceExpensesNewPage />} />
                    <Route path="invoices/expenses/:id" element={<InvoiceExpensesDetailPage />} />
                  </Routes>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* My Payments (consultor + gestor) */}
          <Route
            path="/my-payments/hours"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor']}>
                  <MyPaymentsHoursPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-payments/expenses"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['consultor', 'gestor']}>
                  <MyPaymentsExpensesPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Tickets (all authenticated roles) */}
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute>
                <TicketNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}
