import { create } from 'zustand';
import i18n from '../i18n';

type Locale = 'pt-BR' | 'en-US';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  initialize: () => void;
}

const STORAGE_KEY = 'cloupone-locale';

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'pt-BR',

  setLocale: (locale) => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
    set({ locale });
  },

  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const browserLang = navigator.language;
    const locale: Locale =
      stored === 'pt-BR' || stored === 'en-US'
        ? stored
        : browserLang.startsWith('en') ? 'en-US' : 'pt-BR';
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
    set({ locale });
  },
}));
