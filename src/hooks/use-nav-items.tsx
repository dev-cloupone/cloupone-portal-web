import { type ReactNode } from 'react';
import { LayoutDashboard, Users, Settings, User, Building2, FolderKanban, Tag, Clock, CheckSquare, BarChart3, FileText, Headset, Receipt, Wallet, HandCoins } from 'lucide-react';
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

  if (user?.role === 'super_admin') {
    return [
      {
        group: 'Geral',
        items: [
          { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Horas', path: '/manager-dashboard', icon: <BarChart3 size={18} /> },
        ],
      },
      {
        group: 'Cadastros',
        items: [
          { label: 'Usuarios', path: '/admin/users', icon: <Users size={18} /> },
          { label: 'Clientes', path: '/admin/clients', icon: <Building2 size={18} /> },
          { label: 'Projetos', path: '/admin/projects', icon: <FolderKanban size={18} /> },
          { label: 'Consultores', path: '/admin/consultants', icon: <Users size={18} /> },
          { label: 'Categorias', path: '/admin/activity-categories', icon: <Tag size={18} /> },
          { label: 'Cat. Despesas', path: '/admin/expense-categories', icon: <Receipt size={18} /> },
        ],
      },
      {
        group: 'Operacional',
        items: [
          { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
          { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
          { label: 'Despesas', path: '/expenses', icon: <Wallet size={18} /> },
        ],
      },
      {
        group: 'Aprovações',
        items: [
          { label: 'Aprovações', path: '/approvals', icon: <CheckSquare size={18} /> },
          { label: 'Aprov. Despesas', path: '/expense-approvals', icon: <Receipt size={18} /> },
          { label: 'Reembolsos', path: '/expense-reimbursements', icon: <HandCoins size={18} /> },
        ],
      },
      {
        group: 'Sistema',
        items: [
          { label: 'Relatorios', path: '/admin/reports', icon: <FileText size={18} /> },
          { label: 'Configurações', path: '/admin/settings', icon: <Settings size={18} /> },
          { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
        ],
      },
    ];
  }

  if (user?.role === 'gestor') {
    return [
      {
        group: 'Cadastros',
        items: [
          { label: 'Projetos', path: '/admin/projects', icon: <FolderKanban size={18} /> },
        ],
      },
      {
        group: 'Operacional',
        items: [
          { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
          { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
          { label: 'Despesas', path: '/expenses', icon: <Wallet size={18} /> },
        ],
      },
      {
        group: 'Aprovações',
        items: [
          { label: 'Aprovações', path: '/approvals', icon: <CheckSquare size={18} /> },
          { label: 'Aprov. Despesas', path: '/expense-approvals', icon: <Receipt size={18} /> },
          { label: 'Reembolsos', path: '/expense-reimbursements', icon: <HandCoins size={18} /> },
        ],
      },
      {
        group: 'Sistema',
        items: [
          { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
        ],
      },
    ];
  }

  if (user?.role === 'consultor') {
    return [
      { label: 'Dashboard', path: '/consultant-dashboard', icon: <BarChart3 size={18} /> },
      { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
      { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
      { label: 'Despesas', path: '/expenses', icon: <Wallet size={18} /> },
      { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
    ];
  }

  return [
    { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
    { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
  ];
}
