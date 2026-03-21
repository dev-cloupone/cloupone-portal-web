import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  size?: number;
}

export function Tooltip({ content, size = 14 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!content) return null;

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-text-tertiary transition-colors p-0.5 rounded-full hover:bg-surface-2"
        aria-label="Mais informa\u00e7\u00f5es"
      >
        <HelpCircle size={size} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface-1 p-3 shadow-xl shadow-black/10 text-xs leading-relaxed text-text-secondary">
          {content}
        </div>
      )}
    </div>
  );
}
