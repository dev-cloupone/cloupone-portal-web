import i18n from '../i18n';
import { useLocaleStore } from '../stores/locale.store';

function getLocale() {
  return useLocaleStore.getState().locale;
}

export function formatDate(date: string | Date): string {
  const locale = getLocale();
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(date + 'T12:00:00').toLocaleDateString(locale);
  }
  return new Date(date).toLocaleDateString(locale);
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(getLocale());
}

export function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString(getLocale(), { style: 'currency', currency: 'BRL' });
}

export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[R$\s]/g, '').trim();
  const locale = getLocale();
  if (locale === 'en-US') {
    // en-US: comma = thousands separator, dot = decimal
    return parseFloat(clean.replace(/,/g, '')) || 0;
  }
  // pt-BR: dot = thousands separator, comma = decimal
  if (clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Plain number from API: "100000.00" or "100000"
  return parseFloat(clean) || 0;
}

const SHORT_MONTH_KEYS = [
  'months.janShort', 'months.febShort', 'months.marShort', 'months.aprShort',
  'months.mayShort', 'months.junShort', 'months.julShort', 'months.augShort',
  'months.sepShort', 'months.octShort', 'months.novShort', 'months.decShort',
];

export function getShortMonthNames(): string[] {
  return SHORT_MONTH_KEYS.map((key) => i18n.t(key));
}

export function getShortMonthName(index: number): string {
  return i18n.t(SHORT_MONTH_KEYS[index] || SHORT_MONTH_KEYS[0]);
}

export function toMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
