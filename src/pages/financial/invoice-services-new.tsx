import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import * as invoiceService from '../../services/invoice.service';
import * as projectService from '../../services/project.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import { formatCurrency } from '../../utils/formatters';
import { useLocaleStore } from '../../stores/locale.store';



function buildYearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];
  for (let y = current + 1; y >= current - 3; y--) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

interface PendingProject {
  projectId: string;
  projectName: string;
  clientName: string;
  fixedPriceTotal: string;
  totalInstallments: number;
  installments: {
    id: string;
    installmentNumber: number;
    description: string | null;
    amount: string;
    dueDate: string | null;
  }[];
}

export default function InvoiceServicesNewPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const locale = useLocaleStore((s) => s.locale);
  const [searchParams] = useSearchParams();

  const MONTH_OPTIONS = [
    { value: '1', label: t('months.january') }, { value: '2', label: t('months.february') },
    { value: '3', label: t('months.march') }, { value: '4', label: t('months.april') },
    { value: '5', label: t('months.may') }, { value: '6', label: t('months.june') },
    { value: '7', label: t('months.july') }, { value: '8', label: t('months.august') },
    { value: '9', label: t('months.september') }, { value: '10', label: t('months.october') },
    { value: '11', label: t('months.november') }, { value: '12', label: t('months.december') },
  ];

  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [invoiceType, setInvoiceType] = useState<'hours' | 'fixed_price'>(
    searchParams.get('type') === 'fixed_price' ? 'fixed_price' : 'hours'
  );

  // Fixed price state
  const [pendingData, setPendingData] = useState<{ projects: PendingProject[] } | null>(null);
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100, status: 'active' })
      .then((result) => setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (invoiceType !== 'fixed_price') return;
    setLoadingInstallments(true);
    invoiceService.getPendingInstallmentsDetailed(Number(year), Number(month))
      .then(data => {
        setPendingData(data);
        const allIds = new Set(data.projects.flatMap(p => p.installments.map(i => i.id)));
        setSelectedInstallments(allIds);
      })
      .catch(err => setError(formatApiError(err)))
      .finally(() => setLoadingInstallments(false));
  }, [invoiceType, year, month]);

  function toggleInstallment(id: string) {
    setSelectedInstallments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleProject(projectId: string) {
    if (!pendingData) return;
    const project = pendingData.projects.find(p => p.projectId === projectId);
    if (!project) return;
    const ids = project.installments.map(i => i.id);
    const allSelected = ids.every(id => selectedInstallments.has(id));
    setSelectedInstallments(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  const selectedTotal = pendingData
    ? pendingData.projects
        .flatMap(p => p.installments)
        .filter(i => selectedInstallments.has(i.id))
        .reduce((sum, i) => sum + Number(i.amount), 0)
    : 0;

  const selectedCount = selectedInstallments.size;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await invoiceService.generateDraft({
        projectId,
        year: Number(year),
        month: Number(month),
      });
      addToast(t('invoicesPages.invoiceDraftGenerated'), 'success');
      navigate(`/financial/invoices/services/${result.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitFixedPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingData || selectedCount === 0) return;
    setSubmitting(true);
    setError('');

    try {
      // Agrupar parcelas selecionadas por projeto
      const byProject = new Map<string, string[]>();
      for (const project of pendingData.projects) {
        const ids = project.installments
          .filter(i => selectedInstallments.has(i.id))
          .map(i => i.id);
        if (ids.length > 0) {
          byProject.set(project.projectId, ids);
        }
      }

      // Gerar 1 fatura por projeto
      const results = await Promise.all(
        Array.from(byProject.entries()).map(([projectId, installmentIds]) =>
          invoiceService.generateFromInstallments({
            projectId,
            installmentIds,
            year: Number(year),
            month: Number(month),
          })
        )
      );

      if (results.length === 1) {
        navigate(`/financial/invoices/services/${results[0].id}`);
      } else {
        addToast(t('invoicesPages.invoicesGenerated', { count: results.length }), 'success');
        navigate('/financial/invoices/services');
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('invoicesPages.generateInvoice')}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/services')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('invoicesPages.generateInvoice')}</h2>
        <p className="text-sm text-text-muted mt-1">
          {t('invoicesPages.generateInvoiceSubtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={invoiceType === 'hours' ? handleSubmit : handleSubmitFixedPrice} className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{t('invoicesPages.invoiceData')}</h3>

          {/* Seletor de tipo */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={invoiceType === 'hours' ? 'primary' : 'secondary'}
              onClick={() => setInvoiceType('hours')}
            >
              {t('invoicesPages.byHour')}
            </Button>
            <Button
              type="button"
              variant={invoiceType === 'fixed_price' ? 'primary' : 'secondary'}
              onClick={() => setInvoiceType('fixed_price')}
            >
              {t('invoicesPages.fixedPrice')}
            </Button>
          </div>

          {/* Selects de Ano e Mes (compartilhados) */}
          <Select
            label={t('common.year')}
            options={buildYearOptions()}
            value={year}
            onChange={setYear}
            required
          />

          <Select
            label={t('common.month')}
            options={[{ value: '', label: t('payments.selectMonth') }, ...MONTH_OPTIONS]}
            value={month}
            onChange={setMonth}
            required
          />

          {/* Fluxo por hora */}
          {invoiceType === 'hours' && (
            <Select
              label={t('common.project')}
              options={[{ value: '', label: t('invoicesPages.selectProject') }, ...projectOptions]}
              value={projectId}
              onChange={setProjectId}
              required
            />
          )}
        </div>

        {/* Fluxo valor fixo */}
        {invoiceType === 'fixed_price' && (
          <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
            <p className="text-sm text-text-secondary">
              {t('invoicesPages.installmentsDueUntil', { month: MONTH_OPTIONS[Number(month) - 1]?.label.toLowerCase(), year })}:
            </p>

            {loadingInstallments && <Skeleton className="h-32" />}

            {pendingData && pendingData.projects.length === 0 && !loadingInstallments && (
              <p className="text-sm text-text-muted">{t('invoicesPages.noInstallmentsPending')}</p>
            )}

            {pendingData && pendingData.projects.map(project => (
              <div key={project.projectId} className="border border-border rounded-lg p-4">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.installments.every(i => selectedInstallments.has(i.id))}
                    onChange={() => toggleProject(project.projectId)}
                  />
                  {project.projectName}
                </label>
                <div className="ml-6 mt-2 space-y-1">
                  {project.installments.map(inst => (
                    <label key={inst.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInstallments.has(inst.id)}
                        onChange={() => toggleInstallment(inst.id)}
                      />
                      <span>{inst.installmentNumber}/{project.totalInstallments}</span>
                      <span className="text-text-muted">-</span>
                      <span className="font-mono">{formatCurrency(inst.amount)}</span>
                      {inst.dueDate && (
                        <span className="text-text-muted ml-auto">
                          {t('invoicesPages.dueLabel')}: {new Date(inst.dueDate).toLocaleDateString(locale)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {selectedCount > 0 && (
              <p className="text-sm font-medium">
                {t('invoicesPages.totalSelected', { total: formatCurrency(selectedTotal), count: selectedCount })}
              </p>
            )}

            <p className="text-xs text-text-muted">{t('invoicesPages.oneInvoicePerProject')}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/financial/invoices/services')}>
            {t('common.cancel')}
          </Button>
          {invoiceType === 'hours' ? (
            <Button type="submit" disabled={submitting || !projectId || !year || !month}>
              {submitting ? t('common.generating') : t('projects.generateDraft')}
            </Button>
          ) : (
            <Button type="submit" disabled={submitting || selectedCount === 0}>
              {submitting ? t('common.generating') : t('invoicesPages.generateDrafts')}
            </Button>
          )}
        </div>
      </form>
    </SidebarLayout>
  );
}
