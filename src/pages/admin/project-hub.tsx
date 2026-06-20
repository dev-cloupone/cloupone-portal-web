import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Settings, Layers, Users, Receipt } from 'lucide-react';
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
import { STATUS_LABELS, STATUS_VARIANTS, BUDGET_TYPE_LABELS } from '../../constants/project.constants';

export default function ProjectHubPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);
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
      addToast('Erro ao carregar projeto', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  async function handleDeactivate() {
    if (!confirm('Tem certeza que deseja desativar este projeto?')) return;
    try {
      await projectService.deactivateProject(id!);
      addToast('Projeto desativado', 'success');
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
      title: 'Geral',
      icon: <Settings size={20} />,
      description: 'Nome, cliente, datas, status',
      path: `/admin/projects/${id}/general`,
    },
    {
      title: 'Fases',
      icon: <Layers size={20} />,
      description: `${stats.phaseCount} fase${stats.phaseCount !== 1 ? 's' : ''} · ${stats.subphaseCount} subfase${stats.subphaseCount !== 1 ? 's' : ''}`,
      path: `/admin/projects/${id}/phases`,
    },
    {
      title: 'Equipe',
      icon: <Users size={20} />,
      description: `${stats.allocationCount} membro${stats.allocationCount !== 1 ? 's' : ''}`,
      path: `/admin/projects/${id}/team`,
    },
    {
      title: 'Despesas',
      icon: <Receipt size={20} />,
      description: 'Períodos e categorias',
      path: `/admin/projects/${id}/expenses`,
    },
  ];

  const budgetLabel = project.budgetHours
    ? `${project.budgetHours}h ${BUDGET_TYPE_LABELS[project.budgetType || 'total'] || ''}`
    : null;

  return (
    <SidebarLayout navItems={navItems} title={project.name}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate('/admin/projects')} aria-label="Voltar">
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
            <Badge variant={STATUS_VARIANTS[project.status] || 'default'}>
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
          <p className="text-sm text-text-tertiary">
            {project.clientName}
            {budgetLabel && ` · ${budgetLabel}`}
            {project.startDate && ` · ${new Date(project.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
            {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        {project.isActive && (
          <Button variant="danger" onClick={handleDeactivate}>
            Desativar
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
