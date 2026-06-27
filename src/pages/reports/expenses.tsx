import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { useNavItems } from '../../hooks/use-nav-items';
import { reportCatalogService } from '../../services/report-catalog.service';
import * as projectService from '../../services/project.service';
import * as periodService from '../../services/project-expense-period.service';
import * as bankAccountsService from '../../services/bank-accounts.service';
import type { BankAccountOption } from '../../services/bank-accounts.service';
import { formatApiError } from '../../services/api';
import { WeekMultiSelect } from './components/week-multi-select';
import type { ProjectExpensePeriod } from '../../types/expense.types';
import type { ExpenseReportResult } from '../../types/report.types';
import { formatCurrency } from '../../utils/formatters';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + 'T12:00:00');
  const e = new Date(weekEnd + 'T12:00:00');
  return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

interface ProjectOption { value: string; label: string; }
interface ConsultantOption { value: string; label: string; }

export default function ExpenseReportPage() {
  const navItems = useNavItems();
  const navigate = useNavigate();

  // Filter state
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState('');
  const [periods, setPeriods] = useState<ProjectExpensePeriod[]>([]);
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>([]);
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [consultantId, setConsultantId] = useState('');
  const [view, setView] = useState<'consultant' | 'client'>('consultant');
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [bankAccountId, setBankAccountId] = useState('');

  // Data state
  const [reportData, setReportData] = useState<ExpenseReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [collapsedConsultants, setCollapsedConsultants] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load projects on mount
  useEffect(() => {
    projectService.listProjects({ page: 1, limit: 100 })
      .then((projRes) => {
        setProjects(projRes.data.map((p) => ({ value: p.id, label: p.name })));
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoadingFilters(false));
    bankAccountsService.listActiveBankAccounts()
      .then(setBankAccounts)
      .catch(() => setBankAccounts([]));
  }, []);

  // Load periods and consultants when project changes
  useEffect(() => {
    if (!projectId) {
      setPeriods([]);
      setSelectedWeekIds([]);
      setConsultants([]);
      setConsultantId('');
      return;
    }
    periodService.listByProject(projectId)
      .then((res) => setPeriods(res.data))
      .catch(() => setPeriods([]));
    projectService.listAllocations(projectId)
      .then((res) => {
        setConsultants(res.data.map((a) => ({ value: a.userId, label: a.userName })));
      })
      .catch(() => setConsultants([]));
    setSelectedWeekIds([]);
    setConsultantId('');
    setReportData(null);
  }, [projectId]);

  // Auto-fetch report data when filters are complete
  const fetchData = useCallback(async () => {
    if (!projectId || selectedWeekIds.length === 0) {
      setReportData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('projectId', projectId);
      selectedWeekIds.forEach((id) => params.append('weekIds', id));
      if (consultantId) params.set('consultantId', consultantId);
      params.set('view', view);
      if (view === 'client' && bankAccountId) {
        params.set('bankAccountId', bankAccountId);
      }
      const data = await reportCatalogService.getExpenseData(params);
      setReportData(data);
    } catch (err) {
      setError(formatApiError(err));
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedWeekIds, consultantId, view, bankAccountId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchData]);

  async function handleDownloadPdf() {
    if (!projectId || selectedWeekIds.length === 0) return;
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('projectId', projectId);
      selectedWeekIds.forEach((id) => params.append('weekIds', id));
      if (consultantId) params.set('consultantId', consultantId);
      params.set('view', view);
      if (view === 'client' && bankAccountId) {
        params.set('bankAccountId', bankAccountId);
      }
      const url = reportCatalogService.getExpensePdfUrl(params);
      await reportCatalogService.downloadPdf(url, 'relatorio-despesas.pdf');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPdfLoading(false);
    }
  }

  function toggleConsultant(key: string) {
    setCollapsedConsultants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const valueLabel = view === 'client' ? 'Valor Cobrado' : 'Valor Lançado';

  return (
    <SidebarLayout navItems={navItems} title="Relatório de Despesas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Relatório de Despesas</h1>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Select
                label="Projeto"
                placeholder={loadingFilters ? 'Carregando...' : 'Selecione o projeto'}
                options={projects}
                value={projectId}
                onChange={setProjectId}
              />
            </div>
            <div>
              <Select
                label="Consultor"
                placeholder="Todos"
                options={[{ value: '', label: 'Todos' }, ...consultants]}
                value={consultantId}
                onChange={setConsultantId}
              />
            </div>
            <div>
              <Select
                label="Visão"
                options={[
                  { value: 'consultant', label: 'Consultor' },
                  { value: 'client', label: 'Cliente' },
                ]}
                value={view}
                onChange={(v) => setView(v as 'consultant' | 'client')}
              />
            </div>
            {view === 'client' && (
              <div>
                <Select
                  label="Conta Bancaria"
                  placeholder={bankAccounts.length === 0 ? 'Nenhuma conta cadastrada' : 'Selecione a conta'}
                  options={bankAccounts.map((a) => ({ value: a.id, label: a.label }))}
                  value={bankAccountId}
                  onChange={setBankAccountId}
                />
                {bankAccounts.length === 0 && (
                  <p className="text-[10px] text-warning mt-1">Cadastre contas bancarias em Configuracoes.</p>
                )}
              </div>
            )}
          </div>

          {/* Week selector - full width below filters */}
          <div className="mt-4 border-t border-border pt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Período / Semanas</label>
            {projectId ? (
              <WeekMultiSelect
                periods={periods}
                selectedIds={selectedWeekIds}
                onChange={setSelectedWeekIds}
              />
            ) : (
              <p className="py-3 text-sm text-text-muted">Selecione um projeto primeiro</p>
            )}
          </div>
        </Card>

        {/* Error */}
        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {/* Report data */}
        {!loading && reportData && (
          <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{reportData.project.name}</span>
                <span className="mx-2">|</span>
                Visão: {reportData.view === 'client' ? 'Cliente' : 'Consultor'}
              </div>
              <Button size="sm" onClick={handleDownloadPdf} disabled={pdfLoading || (view === 'client' && !bankAccountId)}>
                <Download size={14} className="mr-1.5" />
                {pdfLoading ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </div>

            {reportData.weeks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-text-tertiary">Nenhuma despesa encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <>
                {reportData.weeks.map((week) => (
                  <Card key={week.weekId}>
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">
                      Semana: {formatWeekRange(week.weekStart, week.weekEnd)}
                    </h3>

                    {week.consultants.map((consultant) => {
                      const key = `${week.weekId}-${consultant.consultantId}`;
                      const isCollapsed = collapsedConsultants.has(key);

                      return (
                        <div key={key} className="mb-3 last:mb-0">
                          <button
                            onClick={() => toggleConsultant(key)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-secondary hover:bg-surface-2 transition-colors"
                          >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            {consultant.consultantName}
                            <span className="ml-auto text-xs text-text-muted">{formatCurrency(consultant.subtotal)}</span>
                          </button>

                          {!isCollapsed && (
                            <div className="mt-1 overflow-x-auto">
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableHeader>Data</TableHeader>
                                    <TableHeader>Categoria</TableHeader>
                                    <TableHeader>Descrição</TableHeader>
                                    <TableHeader className="text-right">{valueLabel}</TableHeader>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {consultant.entries.map((entry, i) => (
                                    <TableRow key={i}>
                                      <TableCell>{formatDate(entry.date)}</TableCell>
                                      <TableCell>{entry.category}</TableCell>
                                      <TableCell>{entry.description}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <tr className="transition-colors hover:bg-surface-2/50">
                                    <td colSpan={3} className="px-4 py-3.5 text-sm text-right font-semibold text-text-primary">Subtotal</td>
                                    <td className="px-4 py-3.5 text-sm text-right font-semibold text-text-primary">{formatCurrency(consultant.subtotal)}</td>
                                  </tr>
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="mt-2 flex items-center justify-end border-t border-border pt-2">
                      <span className="text-sm font-semibold text-text-primary">Total da Semana: {formatCurrency(week.weekTotal)}</span>
                    </div>
                  </Card>
                ))}

                {/* Grand total */}
                <Card>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-text-primary">Total Geral</span>
                    <span className="text-base font-bold text-accent">{formatCurrency(reportData.grandTotal)}</span>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !reportData && !error && projectId && selectedWeekIds.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-tertiary">Nenhum dado disponível.</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
