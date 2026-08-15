import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Settings, Layers, Users, Receipt, DollarSign, Bell } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as projectService from '../../services/project.service';
import * as phaseService from '../../services/phase.service';
import type { Project } from '../../types/project.types';
import { useAuth } from '../../hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { STATUS_LABELS, STATUS_VARIANTS, BUDGET_TYPE_LABELS } from '../../constants/project.constants';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';

export default function ProjectHubPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
  const { user } = useAuth();
  const locale = useLocaleStore((s) => s.locale);
  const isSuperAdmin = user?.role === 'super_admin';
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    phaseCount: 0,
    subphaseCount: 0,
    allocationCount: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [proj, phasesResult, allocationsResult] = await Promise.all([
        projectService.getProject(id!),
        phaseService.listPhases(id!),
        projectService.listAllocations(id!),
      ]);
      setProject(proj);
      setStats({
        phaseCount: phasesResult.data.length,
        subphaseCount: phasesResult.data.reduce((sum, p) => sum + (p.subphaseCount || 0), 0),
        allocationCount: allocationsResult.data.length,
      });
    } catch {
      addToast(t('projects.loadProjectError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  async function handleDeactivate() {
    if (!confirm(t('projects.confirmDeactivate'))) return;
    try {
      await projectService.deactivateProject(id!);
      addToast(t('projects.deactivated'), 'success');
      navigate('/admin/projects');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  if (loading || !project) {
    return (
      <SidebarLayout navItems={navItems} title="Projeto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-surface-2" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-surface-2" />
            ))}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const cards = [
    {
      title: t('projects.general'),
      icon: <Settings size={20} />,
      description: t('projects.generalDesc'),
      path: `/admin/projects/${id}/general`,
    },
    {
      title: t('projects.phases'),
      icon: <Layers size={20} />,
      description: `${stats.phaseCount} fase${stats.phaseCount !== 1 ? 's' : ''} · ${stats.subphaseCount} subfase${stats.subphaseCount !== 1 ? 's' : ''}`,
      path: `/admin/projects/${id}/phases`,
    },
    {
      title: t('projects.team'),
      icon: <Users size={20} />,
      description: `${stats.allocationCount} membro${stats.allocationCount !== 1 ? 's' : ''}`,
      path: `/admin/projects/${id}/team`,
    },
    {
      title: t('projects.expensesCard'),
      icon: <Receipt size={20} />,
      description: t('projects.expensesCardDesc'),
      path: `/admin/projects/${id}/expenses`,
    },
    ...(isSuperAdmin ? [
      {
        title: t('projects.financial'),
        icon: <DollarSign size={20} />,
        description: project.billingType === 'fixed_price'
          ? `Valor Fixo · ${formatCurrency(project.fixedPriceTotal || 0)}`
          : `${formatCurrency(project.billingRate)}/h`,
        path: `/admin/projects/${id}/financial`,
      },
      {
        title: t('projects.notifications'),
        icon: <Bell size={20} />,
        description: t('projects.notificationsDescription'),
        path: `/admin/projects/${id}/notifications`,
      },
    ] : []),
  ];

  const budgetLabel = project.budgetHours
    ? `${project.budgetHours}h ${t(BUDGET_TYPE_LABELS[project.budgetType || 'total'] || 'projects.budgetTotalLower')}`
    : null;

  return (
    <SidebarLayout navItems={navItems} title={project.name}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate('/admin/projects')} aria-label={t('common.back')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
            <Badge variant={STATUS_VARIANTS[project.status] || 'default'}>
              {t(STATUS_LABELS[project.status] || 'projects.statusActive')}
            </Badge>
          </div>
          <p className="text-sm text-text-tertiary">
            {project.clientName}
            {budgetLabel && ` · ${budgetLabel}`}
            {project.startDate && ` · ${new Date(project.startDate).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`}
            {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        {project.isActive && (
          <Button variant="danger" onClick={handleDeactivate}>
            {t('common.deactivate')}
          </Button>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => navigate(card.path)}
          >
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <div className="rounded-lg bg-accent/10 p-2 text-accent">
                {card.icon}
              </div>
            </CardHeader>
            <p className="text-sm text-text-tertiary">{card.description}</p>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
