import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Download, Upload, Loader2 } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import { validateImport, confirmImport } from '../../services/time-entry-import.service';
import { downloadImportTemplate } from '../../utils/import-template';
import type { ImportValidateResponse, ImportConfirmResponse } from '../../types/time-entry-import.types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  consultants: Array<{ id: string; name: string }>;
  isAdminOrGestor: boolean;
  userId: string;
}

type ModalStep = 'upload' | 'preview' | 'result';

const STATUS_CONFIG = {
  valid: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
} as const;

function convertDateToISO(ddmmyyyy: string): string {
  const match = ddmmyyyy.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!match) return ddmmyyyy;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function ImportModal({
  isOpen, onClose, onImportSuccess,
  consultants, isAdminOrGestor, userId,
}: ImportModalProps) {
  const [step, setStep] = useState<ModalStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [consultantId, setConsultantId] = useState('');
  const [validationResult, setValidationResult] = useState<ImportValidateResponse | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportConfirmResponse | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  function handleClose() {
    const wasResult = step === 'result';
    setStep('upload');
    setFile(null);
    setConsultantId('');
    setValidationResult(null);
    setIncludeDuplicates(false);
    setIsLoading(false);
    setImportResult(null);
    onClose();
    if (wasResult) onImportSuccess();
  }

  async function handleValidate() {
    if (!file) return;
    setIsLoading(true);
    try {
      const cId = isAdminOrGestor ? consultantId : undefined;
      const result = await validateImport(file, cId);
      setValidationResult(result);
      setStep('preview');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    if (!validationResult) return;
    setIsLoading(true);
    try {
      const rowsToImport = validationResult.rows
        .filter(r => r.status === 'valid' || (r.status === 'warning' && includeDuplicates))
        .filter(r => r.resolvedIds !== null)
        .map(r => ({
          date: convertDateToISO(r.data.date),
          startTime: r.data.startTime,
          endTime: r.data.endTime,
          projectId: r.resolvedIds!.projectId,
          subphaseId: r.resolvedIds!.subphaseId,
          ticketId: r.resolvedIds!.ticketId,
          description: r.data.description || null,
        }));

      const cId = isAdminOrGestor ? consultantId : userId;
      const result = await confirmImport({
        consultantId: cId,
        rows: rowsToImport,
        includeDuplicates,
      });

      setImportResult(result);
      setStep('result');
      addToast(`${result.imported} apontamentos importados com sucesso!`, 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const importableCount = validationResult
    ? validationResult.valid + (includeDuplicates ? validationResult.warnings : 0)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Apontamentos" className="!max-w-2xl">
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {isAdminOrGestor && (
            <Select
              label="Consultor"
              placeholder="Selecione o consultor"
              options={consultants.map(c => ({ value: c.id, label: c.name }))}
              value={consultantId}
              onChange={setConsultantId}
            />
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
              Arquivo
            </label>
            <div
              onClick={() => document.getElementById('import-file-input')?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                file ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-surface-2/50'
              }`}
            >
              <input
                id="import-file-input"
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      addToast('Arquivo muito grande. Máximo: 5MB', 'error');
                      return;
                    }
                    setFile(f);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
              {file ? (
                <p className="text-sm text-text-primary">{file.name}</p>
              ) : (
                <>
                  <Upload size={24} className="mb-2 text-text-muted" />
                  <p className="text-xs text-text-tertiary">
                    Arraste um arquivo ou <span className="text-accent">clique para selecionar</span>
                  </p>
                  <p className="mt-1 text-[10px] text-text-muted">.xlsx ou .csv, máximo 5MB</p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={downloadImportTemplate}
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <Download size={14} /> Baixar template
          </button>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleValidate}
              disabled={!file || isLoading || (isAdminOrGestor && !consultantId)}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Validar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && validationResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle size={14} /> {validationResult.valid} válidas
            </span>
            <span className="inline-flex items-center gap-1 text-warning">
              <AlertTriangle size={14} /> {validationResult.warnings} avisos
            </span>
            <span className="inline-flex items-center gap-1 text-danger">
              <AlertCircle size={14} /> {validationResult.errors} erros
            </span>
          </div>

          {/* Table */}
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">#</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Data</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Projeto</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Fase</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Subfase</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Início</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-text-tertiary">Fim</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-text-tertiary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {validationResult.rows.map((row) => {
                  const cfg = STATUS_CONFIG[row.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={row.row} className={cfg.bg}>
                      <td className="px-2 py-1.5 text-text-muted">{row.row}</td>
                      <td className="px-2 py-1.5">{row.data.date}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{row.data.project}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{row.data.phase}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{row.data.subphase}</td>
                      <td className="px-2 py-1.5">{row.data.startTime}</td>
                      <td className="px-2 py-1.5">{row.data.endTime}</td>
                      <td className="px-2 py-1.5 text-center" title={row.message || ''}>
                        <Icon size={14} className={`inline ${cfg.color}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Messages for rows with issues (max 5 visible) */}
          {validationResult.rows.some(r => r.message) && (() => {
            const rowsWithMessages = validationResult.rows.filter(r => r.message);
            const maxVisible = 5;
            const hidden = rowsWithMessages.length - maxVisible;
            return (
              <div className="space-y-1 text-xs">
                {rowsWithMessages.slice(0, maxVisible).map((row) => {
                  const cfg = STATUS_CONFIG[row.status];
                  return (
                    <p key={row.row} className={cfg.color}>
                      Linha {row.row}: {row.message}
                    </p>
                  );
                })}
                {hidden > 0 && (
                  <p className="text-text-secondary italic">
                    ...e mais {hidden} {hidden === 1 ? 'problema' : 'problemas'}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Duplicate checkbox */}
          {validationResult.warnings > 0 && (
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={includeDuplicates}
                onChange={(e) => setIncludeDuplicates(e.target.checked)}
                className="rounded border-border"
              />
              Importar duplicatas mesmo assim
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setValidationResult(null); }}>
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={importableCount === 0 || isLoading}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Importar {importableCount} {importableCount === 1 ? 'entrada' : 'entradas'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <div className="space-y-4 text-center py-4">
          <CheckCircle size={48} className="mx-auto text-success" />
          <p className="text-lg font-semibold text-text-primary">
            {importResult.imported} {importResult.imported === 1 ? 'apontamento importado' : 'apontamentos importados'} com sucesso!
          </p>
          {importResult.skipped > 0 && (
            <p className="text-sm text-text-secondary">
              {importResult.skipped} {importResult.skipped === 1 ? 'linha ignorada' : 'linhas ignoradas'}
            </p>
          )}
          <div className="pt-2">
            <Button size="sm" onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
