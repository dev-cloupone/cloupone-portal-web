import { LayoutDashboard, Users, Settings, User, Building2, FolderKanban, Tag, Clock, CheckSquare, BarChart3, FileText, Headset } from 'lucide-react';
import { useAuth } from './use-auth';

export function useNavItems() {
  const { user } = useAuth();

  if (user?.role === 'super_admin') {
    return [
      { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Horas', path: '/manager-dashboard', icon: <BarChart3 size={18} /> },
      { label: 'Usuarios', path: '/admin/users', icon: <Users size={18} /> },
      { label: 'Clientes', path: '/admin/clients', icon: <Building2 size={18} /> },
      { label: 'Projetos', path: '/admin/projects', icon: <FolderKanban size={18} /> },
      { label: 'Consultores', path: '/admin/consultants', icon: <Users size={18} /> },
      { label: 'Categorias', path: '/admin/activity-categories', icon: <Tag size={18} /> },
      { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
      { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
      { label: 'Aprovacoes', path: '/approvals', icon: <CheckSquare size={18} /> },
      { label: 'Relatorios', path: '/admin/reports', icon: <FileText size={18} /> },
      { label: 'Configuracoes', path: '/admin/settings', icon: <Settings size={18} /> },
      { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
    ];
  }

  if (user?.role === 'gestor') {
    return [
      { label: 'Dashboard', path: '/manager-dashboard', icon: <BarChart3 size={18} /> },
      { label: 'Clientes', path: '/admin/clients', icon: <Building2 size={18} /> },
      { label: 'Projetos', path: '/admin/projects', icon: <FolderKanban size={18} /> },
      { label: 'Consultores', path: '/admin/consultants', icon: <Users size={18} /> },
      { label: 'Categorias', path: '/admin/activity-categories', icon: <Tag size={18} /> },
      { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
      { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
      { label: 'Aprovacoes', path: '/approvals', icon: <CheckSquare size={18} /> },
      { label: 'Relatorios', path: '/admin/reports', icon: <FileText size={18} /> },
      { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
    ];
  }

  if (user?.role === 'consultor') {
    return [
      { label: 'Dashboard', path: '/consultant-dashboard', icon: <BarChart3 size={18} /> },
      { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
      { label: 'Apontamento', path: '/timesheet', icon: <Clock size={18} /> },
      { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
    ];
  }

  return [
    { label: 'Atendimento', path: '/tickets', icon: <Headset size={18} /> },
    { label: 'Perfil', path: '/profile', icon: <User size={18} /> },
  ];
}
