export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'administrative' | 'gestor' | 'consultor' | 'client';
  mustChangePassword?: boolean;
  avatarFileId?: string | null;
  clientId?: string | null;
  locale?: 'pt-BR' | 'en-US';
  urgentNotificationsEnabled?: boolean;
  notificationSoundEnabled?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
