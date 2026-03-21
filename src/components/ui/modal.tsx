import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-5 sm:p-6 animate-fade-in">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg max-h-[calc(100vh-2.5rem)] flex flex-col rounded-2xl border border-border bg-surface-1 shadow-2xl animate-scale-in safe-x ${className}`}>
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
          <IconButton onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 sm:px-6 pb-5 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
