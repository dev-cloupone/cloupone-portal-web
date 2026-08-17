/**
 * Beep de notificacao sintetizado via WebAudio (dois tons curtos).
 * Evita adicionar um asset de audio ao bundle.
 */

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

function playTone(ctx: AudioContext, frequency: number, startAt: number, duration: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startAt);

  // Envelope curto para evitar clique no inicio/fim
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.15, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

export function playNotificationSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;

    // A politica de autoplay mantem o contexto suspenso ate a primeira interacao.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.12);
    playTone(ctx, 1180, now + 0.14, 0.16);
  } catch {
    // Audio indisponivel ou bloqueado: falha em silencio
  }
}
