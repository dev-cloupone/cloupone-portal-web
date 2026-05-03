import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { useNavItems } from '../../hooks/use-nav-items';
import { ProjectExpensePeriodsConfig } from '../../components/expenses/project-expense-periods-config';
import * as projectService from '../../services/project.service';

export default function ProjectExpensesConfigPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) return;
    projectService.getProject(projectId).then(p => setProjectName(p.name)).catch(() => {});
  }, [projectId]);

  if (!projectId) return null;

  return (
    <SidebarLayout navItems={navItems} title="Despesas do Projeto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate('/admin/projects')} aria-label="Voltar">
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{projectName || 'Carregando...'}</h1>
          <p className="text-sm text-text-tertiary">Configuração de despesas</p>
        </div>
      </div>

      <ProjectExpensePeriodsConfig projectId={projectId} />
    </SidebarLayout>
  );
}
