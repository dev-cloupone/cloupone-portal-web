import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, Target, Ticket, PlayCircle } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/ui/skeleton';
import { useNavItems } from '../hooks/use-nav-items';
import * as dashboardService from '../services/dashboard.service';
import { ticketService } from '../services/ticket.service';
import { formatApiError } from '../services/api';
import type { ConsultantDashboardData } from '../types/dashboard.types';
import type { TicketStats } from '../types/ticket.types';
import { getShortMonthName } from '../utils/formatters';

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
  danger: '#f43f5e',
  ai: '#8b5cf6',
  surface3: '#1C1D2E',
  textMuted: '#6B6F8A',
  border: '#1E2036',
};

const PIE_COLORS = ['#3B82F6', '#2563EB', '#8b5cf6', '#f59e0b', '#f43f5e', '#38bdf8', '#a78bfa', '#fb7185'];


function formatMonth(month: string): string {
  const [, m] = month.split('-');
  return getShortMonthName(Number(m) - 1);
}

export default function ConsultantDashboardPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const [data, setData] = useState<ConsultantDashboardData | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [result, stats] = await Promise.all([
        dashboardService.getConsultantDashboard(),
        ticketService.getStats().catch(() => null),
      ]);
      setData(result);
      setTicketStats(stats);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const weekPercent = data ? Math.min((data.hoursThisWeek / data.weeklyTarget) * 100, 100) : 0;

  return (
    <SidebarLayout navItems={navItems} title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('dashboard.myDashboard')}</h2>
        <p className="mt-1 text-sm text-text-tertiary">{t('dashboard.myDashboardSubtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-danger">{t('common.errorLoading', { error })}</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.weeklyProgress')}</CardTitle>
                <div className="rounded-lg bg-accent/10 p-2 text-accent"><Target size={20} /></div>
              </CardHeader>
              <p className="text-3xl font-bold text-text-primary">{data.hoursThisWeek.toFixed(1)}h</p>
              <p className="mt-1 text-xs text-text-tertiary">{t('dashboard.weeklyTarget', { hours: data.weeklyTarget })}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-surface-3">
                <div
                  className="h-2 rounded-full bg-accent transition-all"
                  style={{ width: `${weekPercent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-text-muted">{weekPercent.toFixed(0)}%</p>
            </Card>

            <StatCard
              title={t('dashboard.totalMonthHours')}
              value={`${data.hoursThisMonth.toFixed(1)}h`}
              icon={<Clock size={20} />}
              description={t('dashboard.totalMonthHoursDesc')}
            />

          </div>

          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Project Breakdown Pie */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.distributionByProject')}</CardTitle>
                <Badge>{t('dashboard.currentMonth')}</Badge>
              </CardHeader>
              {data.projectBreakdown.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.projectBreakdown}
                        dataKey="hours"
                        nameKey="projectName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${Number(value).toFixed(1)}h`}
                        labelLine={false}
                      >
                        {data.projectBreakdown.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: CHART_COLORS.surface3, border: `1px solid ${CHART_COLORS.border}`, borderRadius: 8, fontSize: 12 }}
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, t('dashboard.hours')]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('dashboard.noDataToShow')}</p>
              )}
            </Card>

            {/* Monthly History */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.monthlyHistory')}</CardTitle>
                <Badge>{t('dashboard.lastSixMonths')}</Badge>
              </CardHeader>
              {data.monthlyHistory.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyHistory.map((d) => ({ ...d, month: formatMonth(d.month) }))} margin={{ left: 10, right: 20 }}>
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
          </div>

          {/* Ticket Stats */}
          {ticketStats && ticketStats.myAssigned > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">{t('dashboard.myTickets')}</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title={t('dashboard.assignedToMe')}
                  value={ticketStats.myAssigned}
                  icon={<Ticket size={20} />}
                  description={t('dashboard.assignedToMeDesc')}
                />
                <StatCard
                  title={t('dashboard.inProgressTickets')}
                  value={(ticketStats.byStatus.in_analysis || 0) + (ticketStats.byStatus.awaiting_customer || 0) + (ticketStats.byStatus.awaiting_third_party || 0)}
                  icon={<PlayCircle size={20} />}
                  description={t('dashboard.inProgressTicketsDesc')}
                />
                <StatCard
                  title={t('dashboard.newThisWeek')}
                  value={ticketStats.recentlyOpened}
                  icon={<Clock size={20} />}
                  description={t('dashboard.newThisWeekDesc')}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('dashboard.logHours')}</p>
                  <p className="text-xs text-text-tertiary">{t('dashboard.logHoursDesc')}</p>
                </div>
                <button
                  onClick={() => navigate('/timesheet')}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                >
                  {t('dashboard.openTimesheet')}
                </button>
              </div>
            </Card>
            {ticketStats && ticketStats.myAssigned > 0 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {t('dashboard.assignedTicketsBanner', { count: ticketStats.myAssigned })}
                    </p>
                    <p className="text-xs text-text-tertiary">{t('dashboard.viewAndUpdateTickets')}</p>
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
