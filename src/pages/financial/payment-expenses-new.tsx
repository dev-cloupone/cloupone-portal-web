import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import * as paymentService from '../../services/expense-payment.service';
import * as consultantService from '../../services/consultant.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';
import type { AvailableExpensePeriod } from '../../types/financial.types';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

export default function PaymentExpensesNewPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [periods, setPeriods] = useState<AvailableExpensePeriod[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null);

  useEffect(() => {
    consultantService.listConsultants({ page: 1, limit: 100 })
      .then((result) => setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setPeriods([]);
      setSelectedPeriods(new Set());
      setExistingDraftId(null);
      return;
    }
    setLoadingPeriods(true);
    setError('');
    setExistingDraftId(null);

    paymentService.getAvailablePeriods(selectedUser)
      .then((data) => {
        setPeriods(data.periods);
        setExistingDraftId(data.existingDraftId);
        setSelectedPeriods(new Set());
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoadingPeriods(false));
  }, [selectedUser]);

  function togglePeriod(periodId: string) {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId);
      else next.add(periodId);
      return next;
    });
  }

  async function handleGenerate() {
    if (!selectedUser || selectedPeriods.size === 0) return;
    setSubmitting(true);
    try {
      const result = await paymentService.generateDraft({
        userId: selectedUser,
        periodIds: [...selectedPeriods],
      });
      addToast('Pagamento gerado com sucesso.', 'success');
      navigate(`/financial/payments/expenses/${result.id}`);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Group periods by project
  const grouped = periods.reduce<Record<string, AvailableExpensePeriod[]>>((acc, p) => {
    if (!acc[p.projectName]) acc[p.projectName] = [];
    acc[p.projectName].push(p);
    return acc;
  }, {});

  return (
    <SidebarLayout navItems={navItems} title="Gerar Pagamento de Despesas">
      <div className="mb-6">
        <button
          onClick={() => navigate('/financial/payments/expenses')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Gerar Pagamento de Despesas</h2>
        <p className="text-sm text-text-muted mt-1">Selecione o consultor e os periodos para gerar o pagamento.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Step 1: Select consultant */}
      <div className="mb-6 max-w-sm">
        <Select
          label="Consultor"
          options={[{ value: '', label: 'Selecione...' }, ...consultantOptions]}
          value={selectedUser}
          onChange={setSelectedUser}
        />
      </div>

      {/* Warning: existing draft */}
      {existingDraftId && (
        <div className="mb-4 rounded-lg bg-warning-muted border border-warning/20 px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-text-primary">Já existe um pagamento em rascunho para este consultor.</p>
            <p className="text-text-secondary mt-0.5">
              Edite ou exclua o rascunho existente antes de gerar um novo.{' '}
              <Link to={`/financial/payments/expenses/${existingDraftId}`} className="text-accent hover:underline font-medium">
                Ver rascunho
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Available periods */}
      {selectedUser && (
        <>
          {loadingPeriods ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : periods.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-1 p-8 text-center">
              <p className="text-text-secondary font-medium">Nenhum periodo disponivel para este consultor.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([projectName, items]) => (
                <div key={projectName} className="rounded-xl border border-border bg-surface-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-surface-2">
                    <h3 className="text-sm font-semibold text-text-primary">{projectName}</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((period) => (
                      <label
                        key={period.periodId}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPeriods.has(period.periodId)}
                          onChange={() => togglePeriod(period.periodId)}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                        />
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <span className="text-sm text-text-primary">
                            {formatDate(period.weekStart)} — {formatDate(period.weekEnd)}
                          </span>
                          <span className="text-xs text-text-muted">
                            {period.expenseCount} despesa(s)
                          </span>
                          <span className="text-sm font-mono font-medium text-text-primary">
                            {formatCurrency(period.totalAmount)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={handleGenerate} disabled={submitting || selectedPeriods.size === 0}>
                  {submitting ? 'Gerando...' : 'Gerar Draft'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
}
