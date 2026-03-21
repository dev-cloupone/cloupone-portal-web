export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'gestor' | 'consultor' | 'user';
  mustChangePassword?: boolean;
  avatarFileId?: string | null;
  clientId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
