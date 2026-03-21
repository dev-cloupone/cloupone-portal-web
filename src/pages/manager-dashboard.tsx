import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
import { formatApiError } from '../services/api';
import type { ManagerDashboardData } from '../types/dashboard.types';
import type { TicketStats } from '../types/ticket.types';

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

const monthLabels: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function formatMonth(month: string): string {
  const [, m] = month.split('-');
  return monthLabels[m] || month;
}

export default function ManagerDashboardPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [result, stats] = await Promise.all([
        dashboardService.getManagerDashboard(),
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

  return (
    <SidebarLayout navItems={navItems} title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard do Gestor</h2>
        <p className="mt-1 text-sm text-text-tertiary">Visao geral de horas e projetos do mes atual</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-danger">Erro ao carregar dashboard: {error}</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Horas no Mes"
              value={`${data.totalHoursThisMonth.toFixed(1)}h`}
              icon={<Clock size={20} />}
              description="Horas submetidas + aprovadas"
            />
            <StatCard
              title="Horas Aprovadas"
              value={`${data.totalHoursApproved.toFixed(1)}h`}
              icon={<CheckSquare size={20} />}
              description="Horas ja aprovadas no mes"
            />
            <StatCard
              title="Horas Pendentes"
              value={`${data.totalHoursPending.toFixed(1)}h`}
              icon={<TrendingUp size={20} />}
              description="Aguardando aprovacao"
            />
            <StatCard
              title="Aprovacoes Pendentes"
              value={data.pendingApprovalCount}
              icon={<AlertTriangle size={20} />}
              description="Apontamentos a aprovar"
            />
          </div>

          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hours by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Horas por Projeto</CardTitle>
                <Badge>Mes Atual</Badge>
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
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Horas']}
                      />
                      <Bar dataKey="hours" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">Sem dados para exibir</p>
              )}
            </Card>

            {/* Hours by Consultant */}
            <Card>
              <CardHeader>
                <CardTitle>Horas por Consultor</CardTitle>
                <Badge>Mes Atual</Badge>
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
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Horas']}
                      />
                      <Bar dataKey="hours" fill={CHART_COLORS.accentHover} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">Sem dados para exibir</p>
              )}
            </Card>
          </div>

          {/* Monthly Trend + Budget Alerts */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensal</CardTitle>
                <Badge>Ultimos 6 Meses</Badge>
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
                        formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Horas']}
                      />
                      <Line type="monotone" dataKey="hours" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ fill: CHART_COLORS.accent, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">Sem dados para exibir</p>
              )}
            </Card>

            {/* Budget Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Orcamento</CardTitle>
                <Badge variant="warning">Projetos &gt; 80%</Badge>
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
                <p className="py-8 text-center text-sm text-text-muted">Nenhum projeto acima de 80% do orcamento</p>
              )}
            </Card>
          </div>

          {/* Ticket Stats */}
          {ticketStats && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Atendimento</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Tickets Abertos"
                  value={(ticketStats.byStatus.open || 0) + (ticketStats.byStatus.reopened || 0) + (ticketStats.byStatus.in_analysis || 0) + (ticketStats.byStatus.in_progress || 0) + (ticketStats.byStatus.in_review || 0)}
                  icon={<Ticket size={20} />}
                  description="Tickets ativos no sistema"
                />
                <StatCard
                  title="Sem Atribuicao"
                  value={ticketStats.unassigned}
                  icon={<UserX2 size={20} />}
                  description="Tickets sem consultor atribuido"
                />
                <StatCard
                  title="Criticos"
                  value={ticketStats.byPriority.critical || 0}
                  icon={<AlertOctagon size={20} />}
                  description="Tickets com prioridade critica"
                />
                <StatCard
                  title="Resolvidos"
                  value={(ticketStats.byStatus.resolved || 0) + (ticketStats.byStatus.closed || 0)}
                  icon={<CheckSquare size={20} />}
                  description="Tickets resolvidos ou fechados"
                />
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
                      Voce tem {data.pendingApprovalCount} apontamento{data.pendingApprovalCount !== 1 ? 's' : ''} aguardando aprovacao
                    </p>
                    <p className="text-xs text-text-tertiary">Clique para revisar e aprovar</p>
                  </div>
                  <button
                    onClick={() => navigate('/approvals')}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                  >
                    Ver Aprovacoes
                  </button>
                </div>
              </Card>
            )}
            {ticketStats && ticketStats.unassigned > 0 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {ticketStats.unassigned} ticket{ticketStats.unassigned !== 1 ? 's' : ''} sem atribuicao
                    </p>
                    <p className="text-xs text-text-tertiary">Atribua consultores para iniciar o atendimento</p>
                  </div>
                  <button
                    onClick={() => navigate('/tickets')}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                  >
                    Ver Tickets
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
