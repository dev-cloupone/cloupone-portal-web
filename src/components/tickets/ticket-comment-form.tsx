import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { MarkdownEditor } from '../shared/markdown-editor';

interface TicketCommentFormProps {
  onSubmit: (content: string, isInternal: boolean) => Promise<void>;
  canMarkInternal: boolean;
}

export function TicketCommentForm({ onSubmit, canMarkInternal }: TicketCommentFormProps) {
  const { t } = useTranslation();
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
        <MarkdownEditor
          value={content}
          onChange={setContent}
          rows={3}
          preview={showPreview}
          placeholder={isInternal ? t('tickets.addInternalNote') : t('tickets.addComment')}
        />

        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? t('common.edit') : t('common.preview')}
            </button>

            {canMarkInternal && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-text-muted hover:text-text-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-surface-2 text-warning focus:ring-warning focus:ring-offset-0"
                />
                {t('tickets.internalNote')}
              </label>
            )}
          </div>

          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            <Send size={14} className="mr-1.5" />
            {isInternal ? t('tickets.internalNoteLabel') : t('common.comment')}
          </Button>
        </div>
      </div>
    </form>
  );
}
