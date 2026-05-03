import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Settings } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useNavItems } from '../../hooks/use-nav-items';
import { useAuth } from '../../hooks/use-auth';
import { reportCatalogService } from '../../services/report-catalog.service';
import { formatApiError } from '../../services/api';
import { PermissionsModal } from './components/permissions-modal';
import type { Report } from '../../types/report.types';

export default function ReportsPage() {
  const navItems = useNavItems();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permModal, setPermModal] = useState<{ reportId: string; reportName: string } | null>(null);

  const isAdmin = user?.role === 'super_admin';

  useEffect(() => {
    reportCatalogService.listReports()
      .then(setReports)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SidebarLayout navItems={navItems} title="Relatórios">
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-surface-2" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={48} className="mb-4 text-text-muted" />
          <p className="text-lg font-semibold text-text-primary">Nenhum relatório disponível</p>
          <p className="mt-1 text-sm text-text-tertiary">
            {isAdmin ? 'Nenhum relatório ativo no momento.' : 'Você ainda não tem acesso a nenhum relatório.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.name}</CardTitle>
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <FileText size={18} />
                </div>
              </CardHeader>
              <p className="mb-4 text-sm text-text-secondary">{report.description}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => navigate(`/reports/${report.slug}`)}>
                  Abrir
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPermModal({ reportId: report.id, reportName: report.name })}
                  >
                    <Settings size={14} className="mr-1.5" />
                    Gerenciar Acesso
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {permModal && (
        <PermissionsModal
          isOpen
          onClose={() => setPermModal(null)}
          reportId={permModal.reportId}
          reportName={permModal.reportName}
        />
      )}
    </SidebarLayout>
  );
}
