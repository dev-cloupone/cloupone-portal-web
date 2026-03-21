import { create } from 'zustand';
import type { User } from '../types/auth.types';
import { setAccessToken, clearAccessToken, setOnAuthFailure, tryRefreshToken } from '../services/api';
import * as authService from '../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setAccessToken(response.accessToken);
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[auth] Logout request failed:', err);
    }
    clearAccessToken();
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const result = await tryRefreshToken();

    if (result.success) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          console.warn('[auth] Failed to parse stored user:', err);
          clearAccessToken();
          set({ isLoading: false });
        }
      } else {
        clearAccessToken();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }

    setOnAuthFailure(() => {
      get().logout();
    });
  },

  setUser: (user: User) => {
    set({ user });
  },
}));

// Persist user on change
useAuthStore.subscribe((state) => {
  if (state.user) {
    localStorage.setItem('user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('user');
  }
});
