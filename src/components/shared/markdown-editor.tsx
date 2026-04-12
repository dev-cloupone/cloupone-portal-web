import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** When true, renders an embedded Preview/Edit toggle button. Ignored if preview is controlled. */
  showToggle?: boolean;
  /** Controlled preview state. If provided, the component does not manage it internally. */
  preview?: boolean;
  minHeightClass?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  showToggle = true,
  preview,
  minHeightClass = 'min-h-[100px]',
}: MarkdownEditorProps) {
  const [internalPreview, setInternalPreview] = useState(false);
  const isControlled = preview !== undefined;
  const showPreview = isControlled ? preview : internalPreview;

  return (
    <div className="space-y-2">
      {showPreview ? (
        <div
          className={`${minHeightClass} px-4 py-3 prose prose-sm max-w-none text-text-secondary [&_a]:text-accent [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg`}
        >
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-text-muted italic">Nada para visualizar</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-text-primary focus:outline-none placeholder:text-text-muted disabled:opacity-50"
        />
      )}

      {showToggle && !isControlled && (
        <button
          type="button"
          onClick={() => setInternalPreview((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Editar' : 'Preview'}
        </button>
      )}
    </div>
  );
}
