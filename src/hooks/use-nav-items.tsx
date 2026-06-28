import { type ReactNode } from 'react';
import { LayoutDashboard, Users, Settings, User, Building2, FolderKanban, Clock, CheckSquare, BarChart3, FileText, Headset, Receipt, Wallet, HandCoins, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry;
}

export function useNavItems(): NavEntry[] {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'super_admin') {
    return [
      {
        group: t('nav.groups.general'),
        items: [
          { label: t('nav.items.dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: t('nav.items.hours'), path: '/manager-dashboard', icon: <BarChart3 size={18} /> },
        ],
      },
      {
        group: t('nav.groups.registrations'),
        items: [
          { label: t('nav.items.users'), path: '/admin/users', icon: <Users size={18} /> },
          { label: t('nav.items.clients'), path: '/admin/clients', icon: <Building2 size={18} /> },
          { label: t('nav.items.projects'), path: '/admin/projects', icon: <FolderKanban size={18} /> },
          { label: t('nav.items.consultants'), path: '/admin/consultants', icon: <Users size={18} /> },
          { label: t('nav.items.expenseCategories'), path: '/admin/expense-categories', icon: <Receipt size={18} /> },
        ],
      },
      {
        group: t('nav.groups.operational'),
        items: [
          { label: t('nav.items.support'), path: '/tickets', icon: <Headset size={18} /> },
          { label: t('nav.items.timesheet'), path: '/timesheet', icon: <Clock size={18} /> },
          { label: t('nav.items.expenses'), path: '/expenses', icon: <Wallet size={18} /> },
        ],
      },
      {
        group: t('nav.groups.approvals'),
        items: [
          { label: t('nav.items.approvals'), path: '/approvals', icon: <CheckSquare size={18} /> },
          { label: t('nav.items.expenseApprovals'), path: '/expense-approvals', icon: <Receipt size={18} /> },
        ],
      },
      {
        group: t('nav.groups.financial'),
        items: [
          { label: t('nav.items.hoursPayment'), path: '/financial/payments/hours', icon: <DollarSign size={18} /> },
          { label: t('nav.items.expensesPayment'), path: '/financial/payments/expenses', icon: <HandCoins size={18} /> },
          { label: t('nav.items.serviceInvoices'), path: '/financial/invoices/services', icon: <FileText size={18} /> },
          { label: t('nav.items.expenseInvoices'), path: '/financial/invoices/expenses', icon: <Receipt size={18} /> },
        ],
      },
      {
        group: t('nav.groups.system'),
        items: [
          { label: t('nav.items.reports'), path: '/reports', icon: <FileText size={18} /> },
          { label: t('nav.items.settings'), path: '/admin/settings', icon: <Settings size={18} /> },
          { label: t('nav.items.profile'), path: '/profile', icon: <User size={18} /> },
        ],
      },
    ];
  }

  if (user?.role === 'administrative') {
    return [
      {
        group: t('nav.groups.payments'),
        items: [
          { label: t('nav.items.hoursPayment'), path: '/financial/payments/hours', icon: <Clock size={18} /> },
          { label: t('nav.items.expensesPayment'), path: '/financial/payments/expenses', icon: <Wallet size={18} /> },
        ],
      },
      {
        group: t('nav.groups.invoices'),
        items: [
          { label: t('nav.items.serviceInvoices'), path: '/financial/invoices/services', icon: <FileText size={18} /> },
          { label: t('nav.items.expenseInvoices'), path: '/financial/invoices/expenses', icon: <Receipt size={18} /> },
        ],
      },
      {
        group: t('nav.groups.system'),
        items: [
          { label: t('nav.items.profile'), path: '/profile', icon: <User size={18} /> },
        ],
      },
    ];
  }

  if (user?.role === 'gestor') {
    return [
      {
        group: t('nav.groups.registrations'),
        items: [
          { label: t('nav.items.projects'), path: '/admin/projects', icon: <FolderKanban size={18} /> },
        ],
      },
      {
        group: t('nav.groups.operational'),
        items: [
          { label: t('nav.items.support'), path: '/tickets', icon: <Headset size={18} /> },
          { label: t('nav.items.timesheet'), path: '/timesheet', icon: <Clock size={18} /> },
          { label: t('nav.items.expenses'), path: '/expenses', icon: <Wallet size={18} /> },
        ],
      },
      {
        group: t('nav.groups.system'),
        items: [
          { label: t('nav.items.reports'), path: '/reports', icon: <FileText size={18} /> },
          { label: t('nav.items.profile'), path: '/profile', icon: <User size={18} /> },
        ],
      },
    ];
  }

  if (user?.role === 'consultor') {
    return [
      { label: t('nav.items.dashboard'), path: '/consultant-dashboard', icon: <BarChart3 size={18} /> },
      { label: t('nav.items.support'), path: '/tickets', icon: <Headset size={18} /> },
      { label: t('nav.items.timesheet'), path: '/timesheet', icon: <Clock size={18} /> },
      { label: t('nav.items.expenses'), path: '/expenses', icon: <Wallet size={18} /> },
      { label: t('nav.items.profile'), path: '/profile', icon: <User size={18} /> },
    ];
  }

  return [
    { label: t('nav.items.support'), path: '/tickets', icon: <Headset size={18} /> },
    { label: t('nav.items.serviceInvoices'), path: '/my-invoices/services', icon: <FileText size={18} /> },
    { label: t('nav.items.expenseInvoices'), path: '/my-invoices/expenses', icon: <Receipt size={18} /> },
    { label: t('nav.items.profile'), path: '/profile', icon: <User size={18} /> },
  ];
}
