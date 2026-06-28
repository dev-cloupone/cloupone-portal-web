import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import * as expenseInvoiceService from '../../services/expense-invoice.service';
import * as projectService from '../../services/project.service';
import { api } from '../../services/api';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import { useLocaleStore } from '../../stores/locale.store';

interface ExpensePeriod {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(useLocaleStore.getState().locale);
}

export default function InvoiceExpensesNewPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectId, setProjectId] = useState('');
  const [periods, setPeriods] = useState<ExpensePeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100, status: 'active' })
      .then((result) => setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) {
      setPeriods([]);
      setSelectedPeriod('');
      return;
    }
    setLoadingPeriods(true);
    setError('');
    api<{ data: ExpensePeriod[] }>(`/projects/${projectId}/expense-periods`)
      .then((result) => {
        setPeriods(result.data);
        setSelectedPeriod('');
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoadingPeriods(false));
  }, [projectId]);

  async function handleGenerate() {
    if (!projectId || !selectedPeriod) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await expenseInvoiceService.generateDraft({ projectId, periodId: selectedPeriod });
      addToast(t('invoicesPages.invoiceDraftGenerated'), 'success');
      navigate(`/financial/invoices/expenses/${result.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('invoicesPages.generateExpenseInvoice')}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/expenses')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('invoicesPages.generateExpenseInvoice')}</h2>
        <p className="text-sm text-text-muted mt-1">{t('invoicesPages.selectProjectAndPeriod')}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <div className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{t('invoicesPages.invoiceData')}</h3>

          <Select
            label={t('common.project')}
            options={[{ value: '', label: t('invoicesPages.selectProject') }, ...projectOptions]}
            value={projectId}
            onChange={setProjectId}
            required
          />
        </div>

        {projectId && (
          <div className="rounded-xl border border-border bg-surface-1 p-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">{t('invoicesPages.periodLabel')}</h3>
            {loadingPeriods ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
              </div>
            ) : periods.length === 0 ? (
              <p className="text-sm text-text-muted">{t('invoicesPages.noPeriodFound')}</p>
            ) : (
              <div className="space-y-2">
                {periods.map((period) => (
                  <label
                    key={period.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      selectedPeriod === period.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="period"
                      value={period.id}
                      checked={selectedPeriod === period.id}
                      onChange={() => setSelectedPeriod(period.id)}
                      className="h-4 w-4 text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-text-primary">
                      {formatDate(period.weekStart)} — {formatDate(period.weekEnd)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      period.status === 'open'
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-3 text-text-muted'
                    }`}>
                      {period.status === 'open' ? t('invoicesPages.periodOpen') : t('invoicesPages.periodClosed')}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/financial/invoices/expenses')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGenerate} disabled={submitting || !projectId || !selectedPeriod}>
            {submitting ? t('common.generating') : t('projects.generateDraft')}
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}
