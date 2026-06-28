import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, CheckSquare, AlertTriangle, TrendingUp, Ticket, UserX2, AlertOctagon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/ui/skeleton';
import { useNavItems } from '../hooks/use-nav-items';
import * as dashboardService from '../services/dashboard.service';
import { ticketService } from '../services/ticket.service';
import { api } from '../services/api';
import { formatApiError } from '../services/api';
import type { ManagerDashboardData } from '../types/dashboard.types';
import type { TicketStats } from '../types/ticket.types';
import { ProgressBar } from '../components/phases/progress-bar';
import { getShortMonthName } from '../utils/formatters';

interface PhasesDashboard {
  alertSubphases: Array<{
    subphaseId: string;
    subphaseName: string;
    phaseName: string;
    projectName: string;
    estimatedHours: number;
    actualHours: number;
    percentage: number;
    endDate: string | null;
  }>;
  overdueSubphases: Array<{
    subphaseId: string;
    subphaseName: string;
    phaseName: string;
    projectName: string;
    estimatedHours: number;
    actualHours: number;
    percentage: number;
    endDate: string | null;
  }>;
  projectSummaries: Array<{
    projectId: string;
    projectName: string;
    totalPhases: number;
    subphases: { planned: number; in_progress: number; completed: number };
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="rounded-lg bg-accent/10 p-2 text-accent">{icon}</div>
      </CardHeader>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-text-tertiary">{description}</p>
      )}
    </Card>
  );
}

const CHART_COLORS = {
  accent: '#3B82F6',
  accentHover: '#2563EB',
  warning: '#f59e0b',
  surface3: '#1C1D2E',
  textMuted: '#6B6F8A',
  border: '#1E2036',
};

function formatMonth(month: string): string {
  const [, m] = month.split('-');
  return getShortMonthName(Number(m) - 1);
}

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [phasesData, setPhasesData] = useState<PhasesDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [result, stats, phases] = await Promise.all([
        dashboardService.getManagerDashboard(),
        ticketService.getStats().catch(() => null),
        api<PhasesDashboard>('/dashboard/phases').catch(() => null),
      ]);
      setData(result);
      setTicketStats(stats);
      setPhasesData(phases);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SidebarLayout navItems={navItems} title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('dashboard.managerDashboard')}</h2>
        <p className="mt-1 text-sm text-text-tertiary">{t('dashboard.managerSubtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-danger">{t('common.errorLoading', { error })}</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('dashboard.monthHours')}
              value={`${data.totalHoursThisMonth.toFixed(1)}h`}
              icon={<Clock size={20} />}
              description={t('dashboard.monthHoursDesc')}
            />
            <StatCard
              title={t('dashboard.approvedHours')}
              value={`${data.totalHoursApproved.toFixed(1)}h`}
              icon={<CheckSquare size={20} />}
              description={t('dashboard.approvedHoursDesc')}
            />
            <StatCard
              title={t('dashboard.pendingHours')}
              value={`${data.totalHoursPending.toFixed(1)}h`}
              icon={<TrendingUp size={20} />}
              description={t('dashboard.pendingHoursDesc')}
            />
            <StatCard
              title={t('dashboard.pendingApprovals')}
              value={data.pendingApprovalCount}
              icon={<AlertTriangle size={20} />}
              description={t('dashboard.pendingApprovalsDesc')}
            />
          </div>

          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hours by Project */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.hoursByProject')}</CardTitle>
                <Badge>{t('dashboard.currentMonth')}</Badge>
              </CardHeader>
              {data.hoursByProject.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hoursByProject} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                      <XAxis type="number" tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="projectName"
                        width={120}
                        tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: CHART_COLORS.surface3, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#fafafa' }}
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, t('dashboard.hours')]}
                      />
                      <Bar dataKey="hours" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.noDataToShow')}</p>
              )}
            </Card>

            {/* Hours by Consultant */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.hoursByConsultant')}</CardTitle>
                <Badge>{t('dashboard.currentMonth')}</Badge>
              </CardHeader>
              {data.hoursByConsultant.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.hoursByConsultant} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                      <XAxis type="number" tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="consultantName"
                        width={120}
                        tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: CHART_COLORS.surface3, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#fafafa' }}
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, t('dashboard.hours')]}
                      />
                      <Bar dataKey="hours" fill={CHART_COLORS.accentHover} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.noDataToShow')}</p>
              )}
            </Card>
          </div>

          {/* Monthly Trend + Budget Alerts */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.monthlyTrend')}</CardTitle>
                <Badge>{t('dashboard.lastSixMonths')}</Badge>
              </CardHeader>
              {data.monthlyTrend.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyTrend.map((d) => ({ ...d, month: formatMonth(d.month) }))} margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                      <XAxis dataKey="month" tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }} />
                      <YAxis tick={{ fill: CHART_COLORS.textMuted, fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: CHART_COLORS.surface3, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#fafafa' }}
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, t('dashboard.hours')]}
                      />
                      <Line type="monotone" dataKey="hours" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ fill: CHART_COLORS.accent, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.noDataToShow')}</p>
              )}
            </Card>

            {/* Budget Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.budgetAlerts')}</CardTitle>
                <Badge variant="warning">{t('dashboard.projectsAbove80')}</Badge>
              </CardHeader>
              {data.budgetAlerts.length > 0 ? (
                <div className="space-y-3">
                  {data.budgetAlerts.map((alert) => (
                    <div key={alert.projectName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{alert.projectName}</span>
                        <Badge variant={alert.usedPercent >= 100 ? 'danger' : 'warning'}>
                          {alert.usedPercent}%
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-3">
                        <div
                          className={`h-2 rounded-full transition-all ${alert.usedPercent >= 100 ? 'bg-danger' : 'bg-warning'}`}
                          style={{ width: `${Math.min(alert.usedPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.noProjectAbove80')}</p>
              )}
            </Card>
          </div>

          {/* Ticket Stats */}
          {ticketStats && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">{t('dashboard.support')}</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title={t('dashboard.openTickets')}
                  value={(ticketStats.byStatus.open || 0) + (ticketStats.byStatus.in_analysis || 0) + (ticketStats.byStatus.awaiting_customer || 0) + (ticketStats.byStatus.awaiting_third_party || 0)}
                  icon={<Ticket size={20} />}
                  description={t('dashboard.openTicketsDesc')}
                />
                <StatCard
                  title={t('dashboard.unassigned')}
                  value={ticketStats.unassigned}
                  icon={<UserX2 size={20} />}
                  description={t('dashboard.unassignedDesc')}
                />
                <StatCard
                  title={t('dashboard.critical')}
                  value={ticketStats.byPriority.critical || 0}
                  icon={<AlertOctagon size={20} />}
                  description={t('dashboard.criticalDesc')}
                />
                <StatCard
                  title={t('dashboard.finished')}
                  value={(ticketStats.byStatus.finished || 0)}
                  icon={<CheckSquare size={20} />}
                  description={t('dashboard.finishedDesc')}
                />
              </div>
            </div>
          )}

          {/* Phases Dashboard */}
          {phasesData && (phasesData.alertSubphases.length > 0 || phasesData.overdueSubphases.length > 0 || phasesData.projectSummaries.length > 0) && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">{t('dashboard.phasesSubphases')}</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Alert Subphases */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.subphasesAlert')}</CardTitle>
                    <Badge variant="warning">{t('dashboard.above80')}</Badge>
                  </CardHeader>
                  {phasesData.alertSubphases.length > 0 ? (
                    <div className="space-y-3">
                      {phasesData.alertSubphases.slice(0, 5).map((sp) => (
                        <div key={sp.subphaseId} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{sp.subphaseName}</p>
                              <p className="text-xs text-text-tertiary truncate">{sp.projectName} / {sp.phaseName}</p>
                            </div>
                          </div>
                          <ProgressBar estimated={sp.estimatedHours} actual={sp.actualHours} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noSubphasesAlert')}</p>
                  )}
                </Card>

                {/* Overdue Subphases */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.overdueSubphases')}</CardTitle>
                    <Badge variant="danger">{t('dashboard.expiredDeadline')}</Badge>
                  </CardHeader>
                  {phasesData.overdueSubphases.length > 0 ? (
                    <div className="space-y-3">
                      {phasesData.overdueSubphases.slice(0, 5).map((sp) => (
                        <div key={sp.subphaseId} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{sp.subphaseName}</p>
                              <p className="text-xs text-text-tertiary truncate">{sp.projectName} / {sp.phaseName}</p>
                            </div>
                            {sp.endDate && (
                              <span className="text-xs text-danger shrink-0">{t('dashboard.expiredOn', { date: sp.endDate })}</span>
                            )}
                          </div>
                          <ProgressBar estimated={sp.estimatedHours} actual={sp.actualHours} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noOverdueSubphases')}</p>
                  )}
                </Card>

                {/* Project Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.overview')}</CardTitle>
                    <Badge>{t('dashboard.byProject')}</Badge>
                  </CardHeader>
                  {phasesData.projectSummaries.length > 0 ? (
                    <div className="space-y-3">
                      {phasesData.projectSummaries.map((ps) => (
                        <div key={ps.projectId}>
                          <p className="text-sm font-medium text-text-primary mb-1">{ps.projectName}</p>
                          <div className="flex gap-2 text-xs">
                            <span className="text-text-tertiary">{ps.totalPhases} {t('dashboard.phases')}</span>
                            <span className="text-text-muted">|</span>
                            <span className="text-text-tertiary">{ps.subphases.planned} {t('dashboard.planned')}</span>
                            <span className="text-warning">{ps.subphases.in_progress} {t('dashboard.inProgress')}</span>
                            <span className="text-accent">{ps.subphases.completed} {t('dashboard.completed')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noProjectWithPhases')}</p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 space-y-4">
            {data.pendingApprovalCount > 0 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {t('dashboard.pendingApprovalsBanner', { count: data.pendingApprovalCount })}
                    </p>
                    <p className="text-xs text-text-tertiary">{t('dashboard.clickToReview')}</p>
                  </div>
                  <button
                    onClick={() => navigate('/approvals')}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                  >
                    {t('dashboard.viewApprovals')}
                  </button>
                </div>
              </Card>
            )}
            {ticketStats && ticketStats.unassigned > 0 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {t('dashboard.unassignedTicketsBanner', { count: ticketStats.unassigned })}
                    </p>
                    <p className="text-xs text-text-tertiary">{t('dashboard.assignConsultants')}</p>
                  </div>
                  <button
                    onClick={() => navigate('/tickets')}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                  >
                    {t('dashboard.viewTickets')}
                  </button>
                </div>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </SidebarLayout>
  );
}
