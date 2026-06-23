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

const MONTH_OPTIONS = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

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

export default function InvoiceHoursNewPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [searchParams] = useSearchParams();

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
      addToast('Fatura draft gerada com sucesso!', 'success');
      navigate(`/financial/invoices/hours/${result.id}`);
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
        navigate(`/financial/invoices/hours/${results[0].id}`);
      } else {
        addToast(`${results.length} faturas geradas com sucesso!`, 'success');
        navigate('/financial/invoices/hours');
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout navItems={navItems} title="Gerar Fatura">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/hours')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Gerar Fatura</h2>
        <p className="text-sm text-text-muted mt-1">
          Selecione o tipo, período e dados para gerar o draft da fatura.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={invoiceType === 'hours' ? handleSubmit : handleSubmitFixedPrice} className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Dados da Fatura</h3>

          {/* Seletor de tipo */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={invoiceType === 'hours' ? 'primary' : 'secondary'}
              onClick={() => setInvoiceType('hours')}
            >
              Por Hora
            </Button>
            <Button
              type="button"
              variant={invoiceType === 'fixed_price' ? 'primary' : 'secondary'}
              onClick={() => setInvoiceType('fixed_price')}
            >
              Valor Fixo
            </Button>
          </div>

          {/* Selects de Ano e Mes (compartilhados) */}
          <Select
            label="Ano"
            options={buildYearOptions()}
            value={year}
            onChange={setYear}
            required
          />

          <Select
            label="Mês"
            options={[{ value: '', label: 'Selecione o mês' }, ...MONTH_OPTIONS]}
            value={month}
            onChange={setMonth}
            required
          />

          {/* Fluxo por hora */}
          {invoiceType === 'hours' && (
            <Select
              label="Projeto"
              options={[{ value: '', label: 'Selecione o projeto' }, ...projectOptions]}
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
              Parcelas com vencimento até {MONTH_OPTIONS[Number(month) - 1]?.label.toLowerCase()}/{year}:
            </p>

            {loadingInstallments && <Skeleton className="h-32" />}

            {pendingData && pendingData.projects.length === 0 && !loadingInstallments && (
              <p className="text-sm text-text-muted">Nenhuma parcela pendente para este período.</p>
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
                          Venc: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {selectedCount > 0 && (
              <p className="text-sm font-medium">
                Total: {formatCurrency(selectedTotal)} ({selectedCount} parcela{selectedCount > 1 ? 's' : ''})
              </p>
            )}

            <p className="text-xs text-text-muted">* Será gerada 1 fatura por projeto</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/financial/invoices/hours')}>
            Cancelar
          </Button>
          {invoiceType === 'hours' ? (
            <Button type="submit" disabled={submitting || !projectId || !year || !month}>
              {submitting ? 'Gerando...' : 'Gerar Draft'}
            </Button>
          ) : (
            <Button type="submit" disabled={submitting || selectedCount === 0}>
              {submitting ? 'Gerando...' : 'Gerar Draft(s)'}
            </Button>
          )}
        </div>
      </form>
    </SidebarLayout>
  );
}
