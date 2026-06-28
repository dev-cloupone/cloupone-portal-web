import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { reportCatalogService } from '../../../services/report-catalog.service';
import { formatApiError } from '../../../services/api';
import type { ReportPermissionUser } from '../../../types/report.types';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportName: string;
}

export function PermissionsModal({ isOpen, onClose, reportId, reportName }: PermissionsModalProps) {
  const [gestores, setGestores] = useState<ReportPermissionUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    reportCatalogService.listPermissions(reportId)
      .then((data) => {
        setGestores(data);
        setSelectedIds(new Set(data.filter((g) => g.hasAccess).map((g) => g.id)));
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [isOpen, reportId]);

  function toggleUser(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await reportCatalogService.updatePermissions(reportId, Array.from(selectedIds));
      onClose();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const filtered = search
    ? gestores.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase()))
    : gestores;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('reports.manageAccessTitle', { name: reportName })}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="space-y-4">
          {gestores.length > 5 && (
            <input
              type="text"
              placeholder={t('reports.searchManager')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          )}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-tertiary">{t('reports.noManagerFound')}</p>
            ) : (
              filtered.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(g.id)}
                    onChange={() => toggleUser(g.id)}
                    className="rounded border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{g.name}</p>
                    <p className="truncate text-xs text-text-tertiary">{g.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
