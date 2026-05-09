import { Outlet } from 'react-router';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Tabs } from '../../components/ui/tabs';
import { useNavItems } from '../../hooks/use-nav-items';

const SETTINGS_TABS = [
  { label: 'Geral', to: '/admin/settings' },
  { label: 'Dados da Empresa', to: '/admin/settings/company-info' },
  { label: 'Contas Bancarias', to: '/admin/settings/bank-accounts' },
];

export default function SettingsLayout() {
  const navItems = useNavItems();

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Configurações da Plataforma</h2>
        <p className="text-sm text-text-tertiary mt-1">Gerencie as configuracoes gerais do sistema</p>
      </div>
      <Tabs tabs={SETTINGS_TABS} />
      <Outlet />
    </SidebarLayout>
  );
}
