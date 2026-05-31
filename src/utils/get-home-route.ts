import type { User } from '../types/auth.types';

export function getHomeRoute(user: User): string {
  if (user.mustChangePassword) {
    return '/change-password-first';
  }

  switch (user.role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'administrative':
      return '/financial/payments/hours';
    case 'gestor':
      return '/admin/projects';
    case 'consultor':
      return '/timesheet';
    case 'client':
      return '/tickets';
    default:
      return '/home';
  }
}
