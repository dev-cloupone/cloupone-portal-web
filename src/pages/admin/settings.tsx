import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Tabs } from '../../components/ui/tabs';
import { useNavItems } from '../../hooks/use-nav-items';

export default function SettingsLayout() {
  const { t } = useTranslation();
  const navItems = useNavItems();

  const SETTINGS_TABS = [
    { label: t('admin.tabGeneral'), to: '/admin/settings' },
    { label: t('admin.tabCompanyInfo'), to: '/admin/settings/company-info' },
    { label: t('admin.tabBankAccounts'), to: '/admin/settings/bank-accounts' },
  ];

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('admin.settingsTitle')}</h2>
        <p className="text-sm text-text-tertiary mt-1">{t('admin.settingsSubtitle')}</p>
      </div>
      <Tabs tabs={SETTINGS_TABS} />
      <Outlet />
    </SidebarLayout>
  );
}
