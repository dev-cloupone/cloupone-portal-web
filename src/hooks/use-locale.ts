import { ptBR, enUS } from 'date-fns/locale';
import { useLocaleStore } from '../stores/locale.store';

export function useDateLocale() {
  const locale = useLocaleStore((s) => s.locale);
  return locale === 'en-US' ? enUS : ptBR;
}
