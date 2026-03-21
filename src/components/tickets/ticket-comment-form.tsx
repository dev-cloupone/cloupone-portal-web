import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';

interface TicketCommentFormProps {
  onSubmit: (content: string, isInternal: boolean) => Promise<void>;
  canMarkInternal: boolean;
}

export function TicketCommentForm({ onSubmit, canMarkInternal }: TicketCommentFormProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), isInternal);
      setContent('');
      setIsInternal(false);
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className={`rounded-xl border transition-colors ${
          isInternal ? 'border-warning/50 bg-warning-muted/20' : 'border-border bg-surface-1'
        }`}
      >
        {showPreview ? (
          <div className="min-h-[100px] px-4 py-3 prose prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg">
            {content.trim() ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-text-muted italic">Nada para visualizar</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={isInternal ? 'Adicionar nota interna...' : 'Adicionar comentario...'}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-text-primary focus:outline-none placeholder:text-text-muted"
          />
        )}

        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? 'Editar' : 'Preview'}
            </button>

            {canMarkInternal && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-surface-2 text-warning focus:ring-warning focus:ring-offset-0"
                />
                Nota interna
              </label>
            )}
          </div>

          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            <Send size={14} className="mr-1.5" />
            {isInternal ? 'Nota Interna' : 'Comentar'}
          </Button>
        </div>
      </div>
    </form>
  );
}
