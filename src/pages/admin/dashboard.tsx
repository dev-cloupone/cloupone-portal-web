import { Users, UserCheck, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { useDashboard } from '../../hooks/use-dashboard';
import { useNavItems } from '../../hooks/use-nav-items';
import { useLocaleStore } from '../../stores/locale.store';

interface StatCardProps {
  title: string;
  value: number;
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const locale = useLocaleStore((s) => s.locale);
  const { data, isLoading, error } = useDashboard();

  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    gestor: t('dashboard.roleManager'),
    consultor: t('dashboard.roleConsultant'),
    client: t('dashboard.roleClient'),
  };

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('dashboard.title')}</h2>
        <p className="mt-1 text-sm text-text-tertiary">{t('dashboard.subtitle')}</p>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={t('dashboard.totalUsers')}
              value={data.totalUsers}
              icon={<Users size={20} />}
              description={t('dashboard.totalUsersDesc')}
            />
            <StatCard
              title={t('dashboard.activeUsers')}
              value={data.activeUsers}
              icon={<UserCheck size={20} />}
              description={t('dashboard.activeUsersDesc')}
            />
            <StatCard
              title={t('dashboard.superAdmins')}
              value={data.totalSuperAdmins}
              icon={<Shield size={20} />}
              description={t('dashboard.superAdminsDesc')}
            />
          </div>

          {data.recentUsers.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">{t('dashboard.recentUsers')}</h3>
              <Card>
                <div className="divide-y divide-border">
                  {data.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user.name}</p>
                        <p className="text-xs text-text-tertiary">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'super_admin' ? 'warning' : 'default'}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {new Date(user.createdAt).toLocaleDateString(locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      ) : null}
    </SidebarLayout>
  );
}
