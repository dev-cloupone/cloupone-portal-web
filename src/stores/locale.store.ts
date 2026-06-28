import { create } from 'zustand';
import i18n from '../i18n';
import { updateMe } from '../services/profile.service';

type Locale = 'pt-BR' | 'en-US';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  initialize: (userLocale?: string | null) => void;
}

const STORAGE_KEY = 'cloupone-locale';

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'pt-BR',

  setLocale: (locale) => {
    if (locale === useLocaleStore.getState().locale) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
    set({ locale });

    // Sync with backend (fire-and-forget)
    updateMe({ locale }).catch(() => {});
  },

  initialize: (userLocale?: string | null) => {
    const locale: Locale =
      userLocale === 'pt-BR' || userLocale === 'en-US'
        ? userLocale
        : (() => {
            const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
            if (stored === 'pt-BR' || stored === 'en-US') return stored;
            return navigator.language.startsWith('en') ? 'en-US' : 'pt-BR';
          })();
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
    set({ locale });
  },
}));
