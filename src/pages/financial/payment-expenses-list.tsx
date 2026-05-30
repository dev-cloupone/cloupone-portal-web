import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Wallet } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { MonthNavigator } from '../../components/ui/month-navigator';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import * as paymentService from '../../services/expense-payment.service';
import * as consultantService from '../../services/consultant.service';
import { formatApiError } from '../../services/api';
import { useNavItems } from '../../hooks/use-nav-items';
import type { ExpensePayment } from '../../types/financial.types';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  confirmed: { label: 'Confirmado', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'danger' },
};

function getLastMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(m: string): { year: number; month: number } {
  const [y, mo] = m.split('-').map(Number);
  return { year: y, month: mo };
}

export default function PaymentExpensesListPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();
  const [data, setData] = useState<ExpensePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(getLastMonth);

  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);

  function goToPreviousMonth() {
    setCurrentMonth((prev) => {
      const { year, month } = parseMonth(prev);
      const d = new Date(year, month - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => {
      const { year, month } = parseMonth(prev);
      const d = new Date(year, month, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  function goToToday() {
    setCurrentMonth(getLastMonth());
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { year, month } = parseMonth(currentMonth);
      const result = await paymentService.listPayments({
        page,
        limit,
        userId: filterConsultant || undefined,
        status: filterStatus || undefined,
        year,
        month,
      });
      setData(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filterConsultant, filterStatus, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    consultantService.listConsultants({ page: 1, limit: 100 })
      .then((result) => setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterConsultant, filterStatus, currentMonth]);

  return (
    <SidebarLayout navItems={navItems} title="Pgto. Despesas">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Pagamento de Despesas</h2>
          <p className="text-sm text-text-muted mt-1">Gerencie pagamentos de despesas dos consultores.</p>
        </div>
        <Button onClick={() => navigate('/financial/payments/expenses/new')}>Gerar Pagamento</Button>
      </div>

      {/* Month Navigator */}
      <div className="mb-4">
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Select
            label="Consultor"
            options={[{ value: '', label: 'Todos' }, ...consultantOptions]}
            value={filterConsultant}
            onChange={setFilterConsultant}
          />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            options={[
              { value: '', label: 'Todos' },
              { value: 'draft', label: 'Rascunho' },
              { value: 'confirmed', label: 'Confirmado' },
              { value: 'paid', label: 'Pago' },
              { value: 'cancelled', label: 'Cancelado' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-danger">{error}</p>
          <button type="button" onClick={loadData} className="text-xs text-danger underline ml-2 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <Wallet size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Nenhum pagamento encontrado</p>
          <p className="text-text-muted text-sm mt-1">Ajuste os filtros ou gere um novo pagamento.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Consultor</TableHeader>
                  <TableHeader>Periodo</TableHeader>
                  <TableHeader className="text-right">Total Valor</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="w-20">Acoes</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((payment) => {
                  const st = STATUS_MAP[payment.status] ?? STATUS_MAP.draft;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <span className="font-medium text-sm">{payment.consultantName}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
                      </TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        {formatCurrency(payment.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/financial/payments/expenses/${payment.id}`)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-text-secondary">
                Pagina {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
}
