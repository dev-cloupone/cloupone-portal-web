import { Users, UserCheck, Shield } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonCard } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { useDashboard } from '../../hooks/use-dashboard';
import { useNavItems } from '../../hooks/use-nav-items';

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
  const navItems = useNavItems();
  const { data, isLoading, error } = useDashboard();

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Painel</h2>
        <p className="mt-1 text-sm text-text-tertiary">Visao geral do sistema</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-danger">Erro ao carregar painel: {error}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total de Usuarios"
              value={data.totalUsers}
              icon={<Users size={20} />}
              description="Usuarios cadastrados no sistema"
            />
            <StatCard
              title="Usuarios Ativos"
              value={data.activeUsers}
              icon={<UserCheck size={20} />}
              description="Usuarios com acesso ativo"
            />
            <StatCard
              title="Super Admins"
              value={data.totalSuperAdmins}
              icon={<Shield size={20} />}
              description="Usuarios com permissao de super admin"
            />
          </div>

          {data.recentUsers.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Usuarios Recentes</h3>
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
                          {user.role === 'super_admin' ? 'Super Admin' : 'Usuario'}
                        </Badge>
                        <span className="text-xs text-text-muted">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
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
