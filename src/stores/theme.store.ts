import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

const STORAGE_KEY = 'template-base-theme';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme: Theme) => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    applyTheme(theme);
    set({ theme });
  },
}));
