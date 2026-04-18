import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => Promise<void>;
  onError?: (error: string) => void;
  preview?: boolean;
  currentFileUrl?: string;
  onRemove?: () => void;
  uploading?: boolean;
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  onUpload,
  onError,
  preview = false,
  currentFileUrl,
  onRemove,
  uploading = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentFileUrl;

  function validateFile(file: File): string | null {
    if (maxSize && file.size > maxSize) {
      return `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const isValid = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      if (!isValid) {
        return 'Tipo de arquivo não permitido.';
      }
    }
    return null;
  }

  async function handleFile(file: File) {
    const error = validateFile(file);
    if (error) {
      onError?.(error);
      return;
    }

    if (preview && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    await onUpload(file);
  }

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRemove() {
    setPreviewUrl(null);
    onRemove?.();
  }

  return (
    <div className="space-y-3">
      {preview && displayUrl && (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Preview"
            className="h-20 w-20 rounded-full object-cover border-2 border-border"
          />
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 rounded-full bg-danger p-1 text-white hover:bg-danger/80 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
          dragActive
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent/50 hover:bg-surface-2/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {uploading ? (
          <p className="text-xs text-text-tertiary">Enviando...</p>
        ) : (
          <>
            {preview ? (
              <ImageIcon size={24} className="mb-2 text-text-muted" />
            ) : (
              <Upload size={24} className="mb-2 text-text-muted" />
            )}
            <p className="text-xs text-text-tertiary">
              Arraste um arquivo ou <span className="text-accent">clique para selecionar</span>
            </p>
            <p className="mt-1 text-[10px] text-text-muted">
              Máximo {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
