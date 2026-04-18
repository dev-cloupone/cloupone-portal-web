import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { MarkdownEditor } from '../shared/markdown-editor';

interface TicketDescriptionProps {
  description: string | null;
  canEdit: boolean;
  onSave: (newDescription: string) => Promise<void>;
}

export function TicketDescription({ description, canEdit, onSave }: TicketDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? '');
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    setDraft(description ?? '');
    setEditing(true);
  };

  const handleCancel = () => {
    if (draft !== (description ?? '') && !window.confirm('Descartar alteracoes na descricao?')) {
      return;
    }
    setDraft(description ?? '');
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      /* handled upstream via toast */
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    if (!description && !canEdit) return null;
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Descrição</h3>
          {canEdit && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <Pencil size={12} />
              Editar
            </button>
          )}
        </div>
        {description ? (
          <div className="prose prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Sem descricao</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Descrição</h3>
      <div className="rounded-xl border border-border bg-surface-1">
        <MarkdownEditor
          value={draft}
          onChange={setDraft}
          rows={8}
          disabled={saving}
          placeholder="Descreva o ticket..."
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={handleCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
