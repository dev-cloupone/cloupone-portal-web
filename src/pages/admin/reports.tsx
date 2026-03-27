import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { DateInput } from '../../components/ui/date-input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/table';
import { useNavItems } from '../../hooks/use-nav-items';
import * as clientService from '../../services/client.service';
import * as consultantService from '../../services/consultant.service';
import * as reportService from '../../services/report.service';
import * as expenseCategoryService from '../../services/expense-category.service';
import { formatApiError } from '../../services/api';
import type { Client } from '../../types/client.types';
import type { Consultant } from '../../types/consultant.types';
import type { ExpenseCategory } from '../../types/expense.types';
import type { ClientReportData, ConsultantReportData, EnhancedClientReportData, ExpenseReportData } from '../../types/report.types';
import { useToastStore } from '../../stores/toast.store';
import * as projectService from '../../services/project.service';
import type { Project } from '../../types/project.types';

type ReportType = 'client' | 'enhanced_client' | 'consultant' | 'billing' | 'payroll' | 'expenses';

const PREVIEWABLE: ReportType[] = ['client', 'enhanced_client', 'consultant', 'expenses'];
const CSV_ENABLED: ReportType[] = ['client', 'enhanced_client', 'consultant', 'expenses'];
const NEEDS_CLIENT: ReportType[] = ['client', 'enhanced_client'];
const NEEDS_CONSULTANT: ReportType[] = ['consultant'];

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

function formatDateBR(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function ReportsPage() {
  const navItems = useNavItems();
  const addToast = useToastStore((s) => s.addToast);

  const [reportType, setReportType] = useState<ReportType>('client');
  const [clientId, setClientId] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expense report filters
  const [expenseProjectId, setExpenseProjectId] = useState('');
  const [expenseConsultantId, setExpenseConsultantId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expenseReimbursementStatus, setExpenseReimbursementStatus] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Preview states
  const [clientPreview, setClientPreview] = useState<ClientReportData | null>(null);
  const [consultantPreview, setConsultantPreview] = useState<ConsultantReportData | null>(null);
  const [enhancedClientPreview, setEnhancedClientPreview] = useState<EnhancedClientReportData | null>(null);
  const [expensePreview, setExpensePreview] = useState<ExpenseReportData | null>(null);

  // Load clients and consultants on mount
  const loadData = useCallback(async () => {
    try {
      const [clientResult, consultantResult, projectResult, categoryResult] = await Promise.all([
        clientService.listClients({ page: 1, limit: 100 }),
        consultantService.listConsultants({ page: 1, limit: 100 }),
        projectService.listProjects({ page: 1, limit: 200 }),
        expenseCategoryService.listCategories(),
      ]);
      setClients(clientResult.data);
      setConsultants(consultantResult.data);
      setAllProjects(projectResult.data);
      setExpenseCategories(categoryResult.data);
    } catch (err) {
      setError(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function clearPreviews() {
    setClientPreview(null);
    setConsultantPreview(null);
    setEnhancedClientPreview(null);
    setExpensePreview(null);
  }

  function handleReportTypeChange(v: string) {
    setReportType(v as ReportType);
    clearPreviews();
    setClientId('');
    setConsultantId('');
    setExpenseProjectId('');
    setExpenseConsultantId('');
    setExpenseCategoryId('');
    setExpenseReimbursementStatus('');
    setError(null);
  }

  function getExpenseFilters() {
    return {
      projectId: expenseProjectId || undefined,
      consultantId: expenseConsultantId || undefined,
      categoryId: expenseCategoryId || undefined,
      reimbursementStatus: expenseReimbursementStatus || undefined,
    };
  }

  // Preview
  async function handlePreview() {
    if (NEEDS_CLIENT.includes(reportType) && !clientId) {
      addToast('Selecione um cliente.', 'warning');
      return;
    }
    if (NEEDS_CONSULTANT.includes(reportType) && !consultantId) {
      addToast('Selecione um consultor.', 'warning');
      return;
    }
    if (!dateRange.from || !dateRange.to) {
      addToast('Selecione o periodo.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      clearPreviews();

      switch (reportType) {
        case 'client': {
          const data = await reportService.getClientReportData(clientId, dateRange.from, dateRange.to);
          setClientPreview(data);
          break;
        }
        case 'consultant': {
          const data = await reportService.getConsultantReportData(consultantId, dateRange.from, dateRange.to);
          setConsultantPreview(data);
          break;
        }
        case 'enhanced_client': {
          const data = await reportService.getEnhancedClientReportData(clientId, dateRange.from, dateRange.to);
          setEnhancedClientPreview(data);
          break;
        }
        case 'expenses': {
          const data = await reportService.getExpenseReportData(dateRange.from, dateRange.to, getExpenseFilters());
          setExpensePreview(data);
          break;
        }
        default:
          await handleDownloadPdf();
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Download PDF
  async function handleDownloadPdf() {
    if (NEEDS_CLIENT.includes(reportType) && !clientId) {
      addToast('Selecione um cliente.', 'warning');
      return;
    }
    if (NEEDS_CONSULTANT.includes(reportType) && !consultantId) {
      addToast('Selecione um consultor.', 'warning');
      return;
    }

    try {
      setIsDownloading(true);
      let url: string;
      let filename: string;

      switch (reportType) {
        case 'client':
          url = reportService.getClientPdfUrl(clientId, dateRange.from, dateRange.to);
          filename = `relatorio-cliente-${dateRange.from}-${dateRange.to}.pdf`;
          break;
        case 'enhanced_client':
          url = reportService.getEnhancedClientPdfUrl(clientId, dateRange.from, dateRange.to);
          filename = `relatorio-cliente-detalhado-${dateRange.from}-${dateRange.to}.pdf`;
          break;
        case 'consultant':
          url = reportService.getConsultantPdfUrl(consultantId, dateRange.from, dateRange.to);
          filename = `relatorio-consultor-${dateRange.from}-${dateRange.to}.pdf`;
          break;
        case 'billing':
          url = reportService.getBillingPdfUrl(dateRange.from, dateRange.to);
          filename = `faturamento-${dateRange.from}-${dateRange.to}.pdf`;
          break;
        case 'payroll':
          url = reportService.getPayrollPdfUrl(dateRange.from, dateRange.to);
          filename = `pagamento-${dateRange.from}-${dateRange.to}.pdf`;
          break;
        case 'expenses':
          url = reportService.getExpensePdfUrl(dateRange.from, dateRange.to, getExpenseFilters());
          filename = `relatorio-despesas-${dateRange.from}-${dateRange.to}.pdf`;
          break;
      }

      await reportService.downloadReport(url, filename);
      addToast('Relatorio gerado com sucesso!', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setIsDownloading(false);
    }
  }

  // Download CSV
  async function handleDownloadCsv() {
    if (NEEDS_CLIENT.includes(reportType) && !clientId) {
      addToast('Selecione um cliente.', 'warning');
      return;
    }
    if (NEEDS_CONSULTANT.includes(reportType) && !consultantId) {
      addToast('Selecione um consultor.', 'warning');
      return;
    }

    try {
      setIsDownloading(true);
      let url: string;
      let filename: string;

      switch (reportType) {
        case 'client':
          url = reportService.getClientCsvUrl(clientId, dateRange.from, dateRange.to);
          filename = `relatorio-cliente-${dateRange.from}-${dateRange.to}.csv`;
          break;
        case 'enhanced_client':
          url = reportService.getEnhancedClientCsvUrl(clientId, dateRange.from, dateRange.to);
          filename = `relatorio-cliente-detalhado-${dateRange.from}-${dateRange.to}.csv`;
          break;
        case 'consultant':
          url = reportService.getConsultantCsvUrl(consultantId, dateRange.from, dateRange.to);
          filename = `relatorio-consultor-${dateRange.from}-${dateRange.to}.csv`;
          break;
        case 'expenses':
          url = reportService.getExpenseCsvUrl(dateRange.from, dateRange.to, getExpenseFilters());
          filename = `relatorio-despesas-${dateRange.from}-${dateRange.to}.csv`;
          break;
        default:
          return;
      }

      await reportService.downloadReport(url, filename);
      addToast('Excel exportado com sucesso!', 'success');
    } catch (err) {
      addToast(formatApiError(err), 'error');
    } finally {
      setIsDownloading(false);
    }
  }

  const reportTypeOptions = [
    { value: 'client', label: 'Relatorio por Cliente' },
    { value: 'enhanced_client', label: 'Relatorio por Cliente (Detalhado)' },
    { value: 'consultant', label: 'Relatorio por Consultor' },
    { value: 'billing', label: 'Relatorio de Faturamento' },
    { value: 'payroll', label: 'Relatorio de Pagamento' },
    { value: 'expenses', label: 'Relatorio de Despesas' },
  ];

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.companyName }));
  const consultantOptions = consultants.map((c) => ({ value: c.userId, label: c.userName }));
  const projectOptions = allProjects.map((p) => ({ value: p.id, label: p.name }));
  const categoryOptions = expenseCategories.map((c) => ({ value: c.id, label: c.name }));
  const reimbursementOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Pago' },
  ];

  const showPreviewBtn = PREVIEWABLE.includes(reportType);
  const showCsvBtn = CSV_ENABLED.includes(reportType);
  const hasAnyPreview = clientPreview || consultantPreview || enhancedClientPreview || expensePreview;

  return (
    <SidebarLayout navItems={navItems} title="Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Relatorios</h2>
        <p className="mt-1 text-sm text-text-tertiary">Gere relatorios de horas, faturamento, pagamento e despesas</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Tipo de Relatorio"
            options={reportTypeOptions}
            value={reportType}
            onChange={handleReportTypeChange}
          />

          {NEEDS_CLIENT.includes(reportType) && (
            <Select
              label="Cliente"
              options={clientOptions}
              value={clientId}
              onChange={setClientId}
              placeholder="Selecione um cliente"
            />
          )}

          {NEEDS_CONSULTANT.includes(reportType) && (
            <Select
              label="Consultor"
              options={consultantOptions}
              value={consultantId}
              onChange={setConsultantId}
              placeholder="Selecione um consultor"
            />
          )}

          {reportType === 'expenses' && (
            <>
              <Select
                label="Projeto"
                options={projectOptions}
                value={expenseProjectId}
                onChange={setExpenseProjectId}
                placeholder="Todos"
              />
              <Select
                label="Consultor"
                options={consultantOptions}
                value={expenseConsultantId}
                onChange={setExpenseConsultantId}
                placeholder="Todos"
              />
              <Select
                label="Categoria"
                options={categoryOptions}
                value={expenseCategoryId}
                onChange={setExpenseCategoryId}
                placeholder="Todas"
              />
              <Select
                label="Reembolso"
                options={reimbursementOptions}
                value={expenseReimbursementStatus}
                onChange={setExpenseReimbursementStatus}
                placeholder="Todos"
              />
            </>
          )}

          <DateInput
            label="Data Inicio"
            value={dateRange.from}
            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
          />

          <DateInput
            label="Data Fim"
            value={dateRange.to}
            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {showPreviewBtn && (
            <Button onClick={handlePreview} disabled={isLoading} size="md">
              <Eye size={16} className="mr-2" />
              {isLoading ? 'Carregando...' : 'Visualizar'}
            </Button>
          )}
          <Button onClick={handleDownloadPdf} disabled={isDownloading} variant="secondary" size="md">
            <FileText size={16} className="mr-2" />
            {isDownloading ? 'Gerando...' : 'Gerar PDF'}
          </Button>
          {showCsvBtn && (
            <Button onClick={handleDownloadCsv} disabled={isDownloading} variant="secondary" size="md">
              <Download size={16} className="mr-2" />
              Exportar Excel
            </Button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Preview: Client Report */}
      {clientPreview && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
              <p className="text-lg font-semibold text-text-primary">{clientPreview.client.companyName}</p>
              {clientPreview.client.cnpj && <p className="text-xs text-text-tertiary">{clientPreview.client.cnpj}</p>}
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Horas</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">{clientPreview.totalHours.toFixed(1)}h</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Valor Total</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-accent">R$ {clientPreview.totalValue.toFixed(2)}</p>
            </Card>
          </div>

          {clientPreview.projectSummary.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Resumo por Projeto</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Projeto</TableHeader>
                    <TableHeader className="text-right">Horas</TableHeader>
                    <TableHeader className="text-right">Taxa/h</TableHeader>
                    <TableHeader className="text-right">Valor</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientPreview.projectSummary.map((p) => (
                    <TableRow key={p.projectName}>
                      <TableCell>{p.projectName}</TableCell>
                      <TableCell className="text-right">{p.hours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">R$ {p.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">R$ {p.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">Detalhamento</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Consultor</TableHeader>
                  <TableHeader>Atividade</TableHeader>
                  <TableHeader>Descricao</TableHeader>
                  <TableHeader className="text-right">Horas</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientPreview.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDateBR(e.date)}</TableCell>
                    <TableCell>{e.consultantName || '-'}</TableCell>
                    <TableCell>{e.activityName || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.description || '-'}</TableCell>
                    <TableCell className="text-right">{Number(e.hours).toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Preview: Consultant Report */}
      {consultantPreview && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Consultor</CardTitle></CardHeader>
              <p className="text-lg font-semibold text-text-primary">{consultantPreview.consultant.name}</p>
              <p className="text-xs text-text-tertiary">{consultantPreview.consultant.contractType.toUpperCase()}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Horas</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">{consultantPreview.totalHours.toFixed(1)}h</p>
              <p className="text-xs text-text-tertiary">Billable: {consultantPreview.totalBillableHours.toFixed(1)}h</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Valor Total</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-accent">R$ {consultantPreview.totalValue.toFixed(2)}</p>
            </Card>
          </div>

          {/* Project Summary */}
          {consultantPreview.projectSummary.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Resumo por Projeto</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Projeto</TableHeader>
                    <TableHeader className="text-right">Horas</TableHeader>
                    <TableHeader className="text-right">Billable</TableHeader>
                    <TableHeader className="text-right">Nao-Billable</TableHeader>
                    <TableHeader className="text-right">Rate</TableHeader>
                    <TableHeader className="text-right">Valor</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consultantPreview.projectSummary.map((p) => (
                    <TableRow key={p.projectName}>
                      <TableCell>{p.projectName}</TableCell>
                      <TableCell className="text-right">{p.totalHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">{p.billableHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">{p.nonBillableHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">R$ {p.billingRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">R$ {p.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Tickets per project */}
          {consultantPreview.projectSummary.filter((p) => p.tickets.length > 0).map((p) => (
            <div key={p.projectName} className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Tickets - {p.projectName}</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Ticket</TableHeader>
                    <TableHeader>Titulo</TableHeader>
                    <TableHeader>Tipo</TableHeader>
                    <TableHeader className="text-right">Estimado</TableHeader>
                    <TableHeader className="text-right">Realizado</TableHeader>
                    <TableHeader className="text-right">Desvio</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.tickets.map((t) => {
                    const desvio = t.estimatedHours != null ? t.actualHours - t.estimatedHours : null;
                    return (
                      <TableRow key={t.ticketCode}>
                        <TableCell>{t.ticketCode}</TableCell>
                        <TableCell className="max-w-xs truncate">{t.ticketTitle}</TableCell>
                        <TableCell>{t.ticketType}</TableCell>
                        <TableCell className="text-right">{t.estimatedHours != null ? t.estimatedHours.toFixed(1) : '-'}</TableCell>
                        <TableCell className="text-right">{t.actualHours.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          {desvio != null ? (desvio > 0 ? `+${desvio.toFixed(1)}` : desvio.toFixed(1)) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}

          {/* Detailed entries */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">Detalhamento</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Projeto</TableHeader>
                  <TableHeader>Ticket</TableHeader>
                  <TableHeader>Atividade</TableHeader>
                  <TableHeader>Billable</TableHeader>
                  <TableHeader className="text-right">Horas</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {consultantPreview.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDateBR(e.date)}</TableCell>
                    <TableCell>{e.projectName}</TableCell>
                    <TableCell>{e.ticketCode || '(sem ticket)'}</TableCell>
                    <TableCell>{e.activityName || '-'}</TableCell>
                    <TableCell>{e.isBillable ? 'Sim' : 'Nao'}</TableCell>
                    <TableCell className="text-right">{Number(e.hours).toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Preview: Enhanced Client Report */}
      {enhancedClientPreview && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
              <p className="text-lg font-semibold text-text-primary">{enhancedClientPreview.client.companyName}</p>
              {enhancedClientPreview.client.cnpj && <p className="text-xs text-text-tertiary">{enhancedClientPreview.client.cnpj}</p>}
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Horas</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">{enhancedClientPreview.totalHours.toFixed(1)}h</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Valor Total</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-accent">R$ {enhancedClientPreview.totalValue.toFixed(2)}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Tickets</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">{enhancedClientPreview.totalTickets}</p>
            </Card>
          </div>

          {/* Ticket status/type summary */}
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-semibold text-text-primary">Resumo de Tickets</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(enhancedClientPreview.ticketStatusSummary)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <span key={status} className="inline-flex items-center rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary">
                    {status.replace(/_/g, ' ')}: {count}
                  </span>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(enhancedClientPreview.ticketTypeSummary)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <span key={type} className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {type}: {count}
                  </span>
                ))}
            </div>
          </div>

          {/* Project summary with budget */}
          {enhancedClientPreview.projectSummary.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Resumo por Projeto</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Projeto</TableHeader>
                    <TableHeader className="text-right">Budget(h)</TableHeader>
                    <TableHeader className="text-right">Utilizado(h)</TableHeader>
                    <TableHeader className="text-right">%</TableHeader>
                    <TableHeader className="text-right">Rate</TableHeader>
                    <TableHeader className="text-right">Valor</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enhancedClientPreview.projectSummary.map((p) => (
                    <TableRow key={p.projectName}>
                      <TableCell>{p.projectName}</TableCell>
                      <TableCell className="text-right">{p.budgetHours != null ? p.budgetHours : '-'}</TableCell>
                      <TableCell className="text-right">{p.totalHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {p.budgetHours != null ? `${((p.totalHours / p.budgetHours) * 100).toFixed(0)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">R$ {p.billingRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">R$ {p.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Tickets per project */}
          {enhancedClientPreview.projectSummary.filter((p) => p.tickets.length > 0).map((p) => (
            <div key={p.projectName} className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Tickets - {p.projectName}</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Codigo</TableHeader>
                    <TableHeader>Titulo</TableHeader>
                    <TableHeader>Tipo</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="text-right">Estimado</TableHeader>
                    <TableHeader className="text-right">Realizado</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.tickets.map((t) => (
                    <TableRow key={t.code}>
                      <TableCell>{t.code}</TableCell>
                      <TableCell className="max-w-xs truncate">{t.title}</TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell>{t.status.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right">{t.estimatedHours != null ? t.estimatedHours.toFixed(1) : '-'}</TableCell>
                      <TableCell className="text-right">{t.actualHours.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}

          {/* Detailed entries */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">Detalhamento</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Consultor</TableHeader>
                  <TableHeader>Ticket</TableHeader>
                  <TableHeader>Atividade</TableHeader>
                  <TableHeader>Descricao</TableHeader>
                  <TableHeader className="text-right">Horas</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {enhancedClientPreview.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDateBR(e.date)}</TableCell>
                    <TableCell>{e.consultantName || '-'}</TableCell>
                    <TableCell>{e.ticketCode || '(sem ticket)'}</TableCell>
                    <TableCell>{e.activityName || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.description || '-'}</TableCell>
                    <TableCell className="text-right">{Number(e.hours).toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Preview: Expense Report */}
      {expensePreview && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader><CardTitle>Total Despesas</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-accent">R$ {expensePreview.totalAmount.toFixed(2)}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Quantidade</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">{expensePreview.totalCount}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Reembolsavel</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-text-primary">R$ {expensePreview.totalReimbursable.toFixed(2)}</p>
            </Card>
            <Card>
              <CardHeader><CardTitle>Reembolsado</CardTitle></CardHeader>
              <p className="text-3xl font-bold text-accent">R$ {expensePreview.totalReimbursed.toFixed(2)}</p>
            </Card>
          </div>

          {/* Category summary */}
          {expensePreview.categorySummary.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-text-primary">Resumo por Categoria</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Categoria</TableHeader>
                    <TableHeader className="text-right">Quantidade</TableHeader>
                    <TableHeader className="text-right">Valor</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expensePreview.categorySummary.map((c) => (
                    <TableRow key={c.categoryName}>
                      <TableCell>{c.categoryName}</TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right font-medium">R$ {c.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Detail */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">Detalhamento</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Consultor</TableHeader>
                  <TableHeader>Projeto</TableHeader>
                  <TableHeader>Categoria</TableHeader>
                  <TableHeader>Descricao</TableHeader>
                  <TableHeader className="text-right">Valor</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {expensePreview.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDateBR(e.date)}</TableCell>
                    <TableCell>{e.consultantName || '-'}</TableCell>
                    <TableCell>{e.projectName}</TableCell>
                    <TableCell>{e.categoryName || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                    <TableCell className="text-right font-medium">R$ {Number(e.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Empty state when no preview */}
      {!hasAnyPreview && !error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <FileText size={48} className="mb-3 opacity-30" />
          <p className="text-sm">Selecione os filtros e clique em &quot;Visualizar&quot; ou &quot;Gerar PDF&quot;</p>
        </div>
      )}
    </SidebarLayout>
  );
}
