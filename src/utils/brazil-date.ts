const BRAZIL_TZ = 'America/Sao_Paulo';

/** Data de hoje no fuso de Brasilia, formato YYYY-MM-DD. */
export function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Soma dias corridos a uma data YYYY-MM-DD. Ancorado em UTC. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/** Formata YYYY-MM-DD para dd/MM/yyyy, por parsing de string (sem Date, sem fuso). */
export function toBrDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
