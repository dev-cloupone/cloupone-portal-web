import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { User, Ticket, PlayCircle, CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';
import { useNavItems } from '../hooks/use-nav-items';
import { ticketService } from '../services/ticket.service';
import type { TicketStats } from '../types/ticket.types';

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

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navItems = useNavItems();
  const navigate = useNavigate();
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const stats = await ticketService.getStats();
      setTicketStats(stats);
    } catch {
      // Silently fail — tickets module might not be accessible
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'client') {
      void loadStats();
    }
  }, [user?.role, loadStats]);

  const isClient = user?.role === 'client';
  const openTickets = ticketStats
    ? (ticketStats.byStatus.open || 0) + (ticketStats.byStatus.in_analysis || 0)
    : 0;
  const inProgressTickets = ticketStats
    ? (ticketStats.byStatus.awaiting_customer || 0) + (ticketStats.byStatus.awaiting_third_party || 0)
    : 0;
  const resolvedTickets = ticketStats
    ? (ticketStats.byStatus.finished || 0)
    : 0;

  return (
    <SidebarLayout navItems={navItems} title="Home">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {t('dashboard.welcome', { name: user?.name })}
        </h2>
        <p className="text-sm text-text-tertiary mt-1">
          {isClient ? t('dashboard.trackRequests') : t('dashboard.homePage')}
        </p>
      </div>

      {isClient && ticketStats ? (
        <>
          {/* Client Ticket Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard
              title={t('dashboard.open')}
              value={openTickets}
              icon={<Ticket size={20} />}
              description={t('dashboard.openTicketsHome')}
            />
            <StatCard
              title={t('dashboard.waiting')}
              value={inProgressTickets}
              icon={<PlayCircle size={20} />}
              description={t('dashboard.waitingTicketsHome')}
            />
            <StatCard
              title={t('dashboard.finished')}
              value={resolvedTickets}
              icon={<CheckCircle2 size={20} />}
              description={t('dashboard.finishedTicketsHome')}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('dashboard.needHelp')}</p>
                  <p className="text-xs text-text-tertiary">{t('dashboard.openNewTicket')}</p>
                </div>
                <Button onClick={() => navigate('/tickets/new')}>
                  <Plus size={14} className="mr-1" /> {t('dashboard.newTicket')}
                </Button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('dashboard.viewAllTickets')}</p>
                  <p className="text-xs text-text-tertiary">{t('dashboard.trackRequestsDesc')}</p>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
                >
                  {t('dashboard.viewTickets')}
                </button>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <div className="max-w-md">
          <Card>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/10 p-3 text-accent">
                <User size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-tertiary">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                {t('dashboard.viewProfile')}
              </Link>
            </div>
          </Card>
        </div>
      )}
    </SidebarLayout>
  );
}
