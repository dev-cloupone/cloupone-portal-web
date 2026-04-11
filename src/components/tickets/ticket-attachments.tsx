import { useRef } from 'react';
import { Paperclip, Download, Trash2, FileText, Image, Film, FileArchive } from 'lucide-react';
import { Button } from '../ui/button';
import { BASE_URL } from '../../services/api';
import type { TicketAttachment } from '../../types/ticket.types';

interface TicketAttachmentsProps {
  attachments: TicketAttachment[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (attachmentId: string) => Promise<void>;
  canRemove: (attachment: TicketAttachment) => boolean;
  uploading?: boolean;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={16} />;
  if (mimeType.startsWith('video/')) return <Film size={16} />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive size={16} />;
  return <FileText size={16} />;
}

export function TicketAttachments({ attachments, onUpload, onRemove, canRemove, uploading, readOnly }: TicketAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  }

  function getDownloadUrl(fileId: string) {
    return `${BASE_URL}/uploads/download/${fileId}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Anexos</h4>
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip size={14} className="mr-1.5" />
              {uploading ? 'Enviando...' : 'Anexar'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-text-muted">Nenhum anexo</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <div className="text-text-muted shrink-0">
                {getFileIcon(attachment.fileMimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{attachment.fileName}</p>
                <p className="text-[11px] text-text-muted">
                  {formatFileSize(attachment.fileSize)} &middot; {attachment.uploadedByName}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={getDownloadUrl(attachment.fileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-text-muted hover:text-accent transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                {!readOnly && canRemove(attachment) && (
                  <button
                    type="button"
                    onClick={() => onRemove(attachment.id)}
                    className="p-1 text-text-muted hover:text-danger transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
