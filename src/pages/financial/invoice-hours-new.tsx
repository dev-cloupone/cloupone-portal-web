import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import * as invoiceService from '../../services/invoice.service';
import * as projectService from '../../services/project.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';

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

export default function InvoiceHoursNewPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100, status: 'active' })
      .then((result) => setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name }))))
      .catch(() => {});
  }, []);

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

  return (
    <SidebarLayout navItems={navItems} title="Gerar Fatura de Horas">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/invoices/hours')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Gerar Fatura de Horas</h2>
        <p className="text-sm text-text-muted mt-1">
          Selecione o projeto e o período para gerar o draft da fatura.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Dados da Fatura</h3>

          <Select
            label="Projeto"
            options={[{ value: '', label: 'Selecione o projeto' }, ...projectOptions]}
            value={projectId}
            onChange={setProjectId}
            required
          />

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
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/financial/invoices/hours')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || !projectId || !year || !month}>
            {submitting ? 'Gerando...' : 'Gerar Draft'}
          </Button>
        </div>
      </form>
    </SidebarLayout>
  );
}
