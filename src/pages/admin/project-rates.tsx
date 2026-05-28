import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useNavItems } from '../../hooks/use-nav-items';
import { useToastStore } from '../../stores/toast.store';
import { formatApiError } from '../../services/api';
import * as rateService from '../../services/consultant-rate.service';
import { ArrowLeft, Save } from 'lucide-react';

interface RateRow {
  userId: string;
  consultantName: string;
  costRate: string;
  billingRate: string;
}

export default function AdminProjectRatesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingUser, setSavingUser] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await rateService.listProjectRates(id);
      setRates(
        data.map((r) => ({
          userId: r.userId,
          consultantName: r.consultantName,
          costRate: r.costRate,
          billingRate: r.billingRate,
        })),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  function updateField(userId: string, field: 'costRate' | 'billingRate', value: string) {
    setRates((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, [field]: value } : r)),
    );
  }

  async function handleSave(row: RateRow) {
    if (!id) return;
    setSavingUser(row.userId);
    try {
      await rateService.updateRate(id, row.userId, {
        costRate: row.costRate,
        billingRate: row.billingRate,
      });
      addToast(`Rates de ${row.consultantName} atualizados.`, 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setSavingUser(null);
    }
  }

  return (
    <SidebarLayout navItems={navItems} title="Rates do Projeto">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/admin/projects')}>
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Rates do Projeto</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <p className="text-text-muted text-sm">Nenhum consultor alocado neste projeto.</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Consultor</TableHeader>
              <TableHeader>Cost Rate (R$)</TableHeader>
              <TableHeader>Billing Rate (R$)</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rates.map((row) => (
              <TableRow key={row.userId}>
                <TableCell className="font-medium">{row.consultantName}</TableCell>
                <TableCell>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.costRate}
                    onChange={(e) => updateField(row.userId, 'costRate', e.target.value)}
                    className="w-28 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-sm font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.billingRate}
                    onChange={(e) => updateField(row.userId, 'billingRate', e.target.value)}
                    className="w-28 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-sm font-mono text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSave(row)}
                    disabled={savingUser === row.userId}
                  >
                    <Save size={16} className="mr-1" />
                    {savingUser === row.userId ? 'Salvando...' : 'Salvar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SidebarLayout>
  );
}
