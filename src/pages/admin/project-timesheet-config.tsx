import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { IconButton } from '../../components/ui/icon-button';
import { useNavItems } from '../../hooks/use-nav-items';
import { ProjectTimesheetLockConfig } from '../../components/timesheet/project-timesheet-lock-config';
import * as projectService from '../../services/project.service';

export default function ProjectTimesheetConfigPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const navItems = useNavItems();
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) return;
    projectService.getProject(projectId).then(p => setProjectName(p.name)).catch(() => {});
  }, [projectId]);

  if (!projectId) return null;

  return (
    <SidebarLayout navItems={navItems} title={t('projects.timesheetCard')}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <IconButton onClick={() => navigate(`/admin/projects/${projectId}`)} aria-label={t('common.back')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{projectName || t('common.loading')}</h1>
          <p className="text-sm text-text-tertiary">{t('projects.timesheetCardDesc')}</p>
        </div>
      </div>

      <ProjectTimesheetLockConfig projectId={projectId} />
    </SidebarLayout>
  );
}
