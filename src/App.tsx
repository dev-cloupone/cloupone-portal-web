import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
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

// Super Admin pages (lazy)
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/users'));
const AdminSettingsPage = lazy(() => import('./pages/admin/settings'));

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

// Approvals (gestor + super_admin)
const ApprovalsPage = lazy(() => import('./pages/approvals'));

// Expenses (consultor + gestor + super_admin)
const ExpensesPage = lazy(() => import('./pages/expenses'));

// Expense Approvals (gestor + super_admin)
const ExpenseApprovalsPage = lazy(() => import('./pages/expense-approvals'));

// Expense Reimbursements (gestor + super_admin)
const ExpenseReimbursementsPage = lazy(() => import('./pages/expense-reimbursements'));

// Expense Report (gestor + super_admin)
const ExpenseReportPage = lazy(() => import('./pages/expense-report'));

// Dashboards
const ManagerDashboardPage = lazy(() => import('./pages/manager-dashboard'));
const ConsultantDashboardPage = lazy(() => import('./pages/consultant-dashboard'));

// Reports (gestor + super_admin)
const AdminReportsPage = lazy(() => import('./pages/admin/reports'));

// Tickets (all authenticated roles)
const TicketsPage = lazy(() => import('./pages/tickets'));
const TicketNewPage = lazy(() => import('./pages/ticket-new'));
const TicketDetailPage = lazy(() => import('./pages/ticket-detail'));

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeTheme = useThemeStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
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
                    <Route path="settings" element={<RoleGuard allowedRoles={['super_admin']}><AdminSettingsPage /></RoleGuard>} />
                    <Route path="clients" element={<RoleGuard allowedRoles={['super_admin']}><AdminClientsPage /></RoleGuard>} />
                    <Route path="consultants" element={<RoleGuard allowedRoles={['super_admin']}><AdminConsultantsPage /></RoleGuard>} />
                    <Route path="expense-categories" element={<RoleGuard allowedRoles={['super_admin']}><AdminExpenseCategoriesPage /></RoleGuard>} />
                    <Route path="reports" element={<RoleGuard allowedRoles={['super_admin']}><AdminReportsPage /></RoleGuard>} />
                    {/* super_admin + gestor */}
                    <Route path="projects" element={<AdminProjectsPage />} />
                    <Route path="projects/:id/phases" element={<AdminProjectPhasesPage />} />
                    <Route path="projects/:id/expenses" element={<AdminProjectExpensesConfigPage />} />
                    <Route path="projects/:id/expense-categories" element={<AdminProjectExpenseCategoriesConfigPage />} />
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

          {/* Approvals (gestor + super_admin) */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['gestor', 'super_admin']}>
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

          {/* Expense Approvals (gestor + super_admin) */}
          <Route
            path="/expense-approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['gestor', 'super_admin']}>
                  <ExpenseApprovalsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Expense Reimbursements (gestor + super_admin) */}
          <Route
            path="/expense-reimbursements"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['gestor', 'super_admin']}>
                  <ExpenseReimbursementsPage />
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Expense Report (gestor + super_admin) */}
          <Route
            path="/expense-report"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['gestor', 'super_admin']}>
                  <ExpenseReportPage />
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
