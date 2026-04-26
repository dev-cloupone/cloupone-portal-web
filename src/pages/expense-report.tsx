import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import * as reportService from '../services/report.service';
import * as projectService from '../services/project.service';
import * as periodService from '../services/project-expense-period.service';
import * as consultantService from '../services/consultant.service';
import * as projectExpenseCategoryService from '../services/project-expense-category.service';
import { formatApiError } from '../services/api';
import { useToastStore } from '../stores/toast.store';
import { useNavItems } from '../hooks/use-nav-items';
import type { ProjectExpensePeriod, WeeklyExpenseReport } from '../types/expense.types';

function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatWeekRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export default function ExpenseReportPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [periodOptions, setPeriodOptions] = useState<{ value: string; label: string; period: ProjectExpensePeriod }[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [reportData, setReportData] = useState<WeeklyExpenseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedConsultants, setExpandedConsultants] = useState<Set<string>>(new Set());

  // Filters
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReimbursement, setFilterReimbursement] = useState('');
  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectService.listProjects({ page: 1, limit: 100 });
        setProjectOptions(result.data.map((p) => ({ value: p.id, label: p.name })));
      } catch { /* silent */ }
    }
    loadProjects();
  }, []);

  // Load consultants and categories when project changes
  useEffect(() => {
    if (!selectedProject) {
      setConsultantOptions([]);
      setCategoryOptions([]);
      return;
    }
    consultantService.listConsultants({ page: 1, limit: 100 }).then((res) => {
      setConsultantOptions(res.data.map((c) => ({ value: c.userId, label: c.userName })));
    }).catch(() => {});
    projectExpenseCategoryService.listByProject(selectedProject).then((res) => {
      setCategoryOptions(res.data.map((c) => ({ value: c.id, label: c.name })));
    }).catch(() => {});
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setPeriodOptions([]);
      setSelectedPeriod('');
      return;
    }
    async function loadPeriods() {
      try {
        const result = await periodService.listByProject(selectedProject);
        setPeriodOptions(result.data.map(p => ({
          value: p.weekStart,
          label: `${formatWeekRange(p.weekStart, p.weekEnd)} (${p.status === 'open' ? 'Aberto' : 'Fechado'})`,
          period: p,
        })));
      } catch { /* silent */ }
    }
    loadPeriods();
  }, [selectedProject]);

  const loadReport = useCallback(async () => {
    if (!selectedProject || !selectedPeriod) return;
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getWeeklyExpenseReport(selectedProject, selectedPeriod, {
        consultantId: filterConsultant || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        reimbursementStatus: filterReimbursement || undefined,
      });
      setReportData(data);
    } catch (err) {
      setError(formatApiError(err));
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedPeriod, filterConsultant, filterCategory, filterStatus, filterReimbursement]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function toggleConsultant(id: string) {
    setExpandedConsultants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDownloadCsv() {
    if (!selectedProject || !selectedPeriod) return;
    try {
      const url = reportService.getWeeklyExpenseCsvUrl(selectedProject, selectedPeriod, {
        consultantId: filterConsultant || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        reimbursementStatus: filterReimbursement || undefined,
      });
      await reportService.downloadReport(url, `despesas-semanal-${selectedPeriod}.csv`);
    } catch (err) {
      addToast(formatApiError(err), 'error');
    }
  }

  return (
    <SidebarLayout navItems={navItems} title="Rel. Despesas">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Relatório Semanal de Despesas</h2>
      </div>

      {/* Selectors */}
      <div className="mb-6 flex flex-wrap gap-3 items-end">
        <div className="w-56">
          <Select
            label="Projeto"
            options={[{ value: '', label: 'Selecione...' }, ...projectOptions]}
            value={selectedProject}
            onChange={(v) => { setSelectedProject(v); setSelectedPeriod(''); setReportData(null); }}
          />
        </div>
        {selectedProject && periodOptions.length > 0 && (
          <div className="w-64">
            <Select
              label="Semana"
              options={[{ value: '', label: 'Selecione...' }, ...periodOptions]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </div>
        )}
        {selectedProject && selectedPeriod && (
          <>
            <div className="w-44">
              <Select
                label="Consultor"
                options={[{ value: '', label: 'Todos' }, ...consultantOptions]}
                value={filterConsultant}
                onChange={setFilterConsultant}
              />
            </div>
            <div className="w-44">
              <Select
                label="Categoria"
                options={[{ value: '', label: 'Todas' }, ...categoryOptions]}
                value={filterCategory}
                onChange={setFilterCategory}
              />
            </div>
            <div className="w-36">
              <Select
                label="Status"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'created', label: 'Criado' },
                  { value: 'approved', label: 'Aprovado' },
                  { value: 'rejected', label: 'Rejeitado' },
                ]}
                value={filterStatus}
                onChange={setFilterStatus}
              />
            </div>
            <div className="w-40">
              <Select
                label="Reembolso"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'paid', label: 'Pago' },
                ]}
                value={filterReimbursement}
                onChange={setFilterReimbursement}
              />
            </div>
          </>
        )}
        {reportData && (
          <>
            <Button variant="secondary" size="sm" disabled title="Em breve">
              <FileText size={14} className="mr-1.5" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadCsv}>
              <FileSpreadsheet size={14} className="mr-1.5" /> CSV
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !reportData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-16">
          <FileSpreadsheet size={40} className="text-accent mb-3" />
          <p className="text-text-secondary font-medium">Selecione um projeto e uma semana</p>
          <p className="text-text-muted text-sm mt-1">para gerar o relatório de despesas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header info */}
          <div className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Projeto</p>
                <p className="font-semibold text-text-primary">{reportData.project.name}</p>
                <p className="text-sm text-text-muted">{reportData.project.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Semana</p>
                <p className="font-semibold text-text-primary">{formatWeekRange(reportData.period.weekStart, reportData.period.weekEnd)}</p>
                <Badge variant={reportData.period.status === 'open' ? 'success' : 'default'}>
                  {reportData.period.status === 'open' ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-text-primary">{formatCurrency(reportData.totals.totalAmount)}</p>
                <p className="text-xs text-text-muted">{reportData.totals.expenseCount} despesas</p>
              </div>
              {reportData.totals.totalClientCharge !== reportData.totals.totalAmount && (
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Cobrança Cliente</p>
                  <p className="text-lg font-bold text-accent">{formatCurrency(reportData.totals.totalClientCharge)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Reembolsável</p>
                <p className="font-semibold text-text-primary">{formatCurrency(reportData.totals.totalReimbursable)}</p>
              </div>
            </div>
          </div>

          {/* By Consultant */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Por Consultor</h3>
            <div className="space-y-2">
              {reportData.byConsultant.map((group) => (
                <div key={group.consultantId} className="rounded-xl border border-border bg-surface-1 overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-2/50"
                    onClick={() => toggleConsultant(group.consultantId)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedConsultants.has(group.consultantId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-semibold text-sm">{group.consultantName}</span>
                      <span className="text-xs text-text-muted">{group.expenseCount} despesas</span>
                    </div>
                    <span className="font-bold">{formatCurrency(group.totalAmount)}</span>
                  </div>
                  {expandedConsultants.has(group.consultantId) && (
                    <div className="border-t border-border px-4 py-3">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Data</TableHeader>
                            <TableHeader>Categoria</TableHeader>
                            <TableHeader>Descrição</TableHeader>
                            <TableHeader className="text-right">Valor</TableHeader>
                            <TableHeader className="text-right">Cobrança</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.expenses.map((e, i) => (
                            <TableRow key={i}>
                              <TableCell>{formatDate(e.date)}</TableCell>
                              <TableCell>{e.categoryName || '—'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {e.kmQuantity ? `${Number(e.kmQuantity).toFixed(1)} km` : (e.description || '—')}
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(e.amount)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(e.clientChargeAmount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* By Category */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Por Categoria</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Categoria</TableHeader>
                  <TableHeader>Limite</TableHeader>
                  <TableHeader className="text-right">Total</TableHeader>
                  <TableHeader className="text-right">Cobrança</TableHeader>
                  <TableHeader className="text-right">% Utilizado</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.byCategory.map((cat) => (
                  <TableRow key={cat.categoryName}>
                    <TableCell className="font-medium">{cat.categoryName}</TableCell>
                    <TableCell>{cat.maxAmount ? formatCurrency(cat.maxAmount) : '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(cat.totalAmount)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(cat.totalClientCharge)}</TableCell>
                    <TableCell className="text-right">
                      {cat.percentUsed != null ? (
                        <span className={cat.percentUsed > 100 ? 'text-danger font-bold' : ''}>
                          {cat.percentUsed.toFixed(0)}%
                        </span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
