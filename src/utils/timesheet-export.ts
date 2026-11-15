import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TimeEntryListItem } from '../types/time-entry.types';
import { useLocaleStore } from '../stores/locale.store';
import { formatCurrency } from './formatters';

const BRAND_COLOR: [number, number, number] = [96, 165, 250];

async function loadLogoAsDataUrl(): Promise<string> {
  const response = await fetch('/cloup-one-logo.png');
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export type RateSource = 'real' | 'partner';

export interface RateColumnsOptions {
  client: RateSource;
  consultant: RateSource;
}

export interface ExportOptions {
  entries: TimeEntryListItem[];
  totalHours: string;
  currentMonth: string;
  consultantName?: string;
  projectName?: string;
  showConsultantColumn: boolean;
  hoursField?: 'hours' | 'adjustedHours';
  rateColumns?: RateColumnsOptions;
}

function getFileName(month: string, consultantName: string | undefined, ext: string) {
  const base = `apontamentos_${month}`;
  if (consultantName) return `${base}_${consultantName.replace(/\s+/g, '_')}.${ext}`;
  return `${base}.${ext}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const CLIENT_TOTAL_HEADER = 'Total cliente';
const CONSULTANT_TOTAL_HEADER = 'Total consultor';

function clientRateOf(e: TimeEntryListItem, rateColumns: RateColumnsOptions): number {
  return Number((rateColumns.client === 'partner' ? e.partnerBillingRate : e.billingRate) ?? 0);
}

function consultantRateOf(e: TimeEntryListItem, rateColumns: RateColumnsOptions): number {
  return Number((rateColumns.consultant === 'partner' ? e.partnerCostRate : e.costRate) ?? 0);
}

function getHeaders(showConsultant: boolean, rateColumns?: RateColumnsOptions): string[] {
  const headers = ['Data'];
  if (showConsultant) headers.push('Consultor');
  headers.push('Projeto', 'Fase', 'Subfase', 'Ticket', 'Início', 'Fim', 'Horas', 'Descrição');
  if (rateColumns) headers.push(CLIENT_TOTAL_HEADER, CONSULTANT_TOTAL_HEADER);
  return headers;
}

function buildRows(
  entries: TimeEntryListItem[],
  showConsultant: boolean,
  hoursField: 'hours' | 'adjustedHours',
  rateColumns?: RateColumnsOptions,
): string[][] {
  return entries.map(e => {
    const hoursValue = Number(e[hoursField] ?? e.hours);
    const row: string[] = [formatDate(e.date)];
    if (showConsultant) row.push(e.consultantName);
    row.push(
      e.projectName,
      e.phaseName || '-',
      e.subphaseName || '-',
      e.ticketCode || '-',
      e.startTime.slice(0, 5),
      e.endTime.slice(0, 5),
      hoursValue.toFixed(2),
      e.description || '-',
    );
    if (rateColumns) {
      row.push(
        formatCurrency(clientRateOf(e, rateColumns) * hoursValue),
        formatCurrency(consultantRateOf(e, rateColumns) * hoursValue),
      );
    }
    return row;
  });
}

function buildTotalRow(
  headers: string[],
  entries: TimeEntryListItem[],
  totalHours: string,
  hoursField: 'hours' | 'adjustedHours',
  rateColumns?: RateColumnsOptions,
): string[] {
  const totalRow = new Array(headers.length).fill('');
  const horasIdx = headers.indexOf('Horas');
  totalRow[horasIdx - 1] = 'Total:';
  totalRow[horasIdx] = hoursField === 'hours'
    ? totalHours
    : entries.reduce((sum, e) => sum + Number(e[hoursField] ?? e.hours), 0).toFixed(2);

  if (rateColumns) {
    const clientTotal = entries.reduce((sum, e) => sum + clientRateOf(e, rateColumns) * Number(e[hoursField] ?? e.hours), 0);
    const consultantTotal = entries.reduce((sum, e) => sum + consultantRateOf(e, rateColumns) * Number(e[hoursField] ?? e.hours), 0);
    totalRow[headers.indexOf(CLIENT_TOTAL_HEADER)] = formatCurrency(clientTotal);
    totalRow[headers.indexOf(CONSULTANT_TOTAL_HEADER)] = formatCurrency(consultantTotal);
  }

  return totalRow;
}

interface HeaderOptions {
  currentMonth: string;
  logoDataUrl: string;
  consultantName?: string;
  projectName?: string;
}

function drawHeader(doc: jsPDF, pageWidth: number, opts: HeaderOptions): number {
  doc.addImage(opts.logoDataUrl, 'PNG', 14, 5, 45, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text('Relat\u00f3rio de Apontamentos', pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  let y = 18;
  doc.text(`Per\u00edodo: ${opts.currentMonth}`, pageWidth - 14, y, { align: 'right' });

  if (opts.projectName) {
    y += 5;
    doc.text(`Projeto: ${opts.projectName}`, pageWidth - 14, y, { align: 'right' });
  }
  if (opts.consultantName) {
    y += 5;
    doc.text(`Consultor: ${opts.consultantName}`, pageWidth - 14, y, { align: 'right' });
  }

  const lineY = y + 4;
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.8);
  doc.line(14, lineY, pageWidth - 14, lineY);

  return lineY + 6;
}

export function exportToExcel(options: ExportOptions) {
  const {
    entries, totalHours, currentMonth, consultantName, showConsultantColumn,
    hoursField = 'hours', rateColumns,
  } = options;
  const headers = getHeaders(showConsultantColumn, rateColumns);
  const rows = buildRows(entries, showConsultantColumn, hoursField, rateColumns);
  rows.push(buildTotalRow(headers, entries, totalHours, hoursField, rateColumns));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Apontamentos');
  XLSX.writeFile(wb, getFileName(currentMonth, consultantName, 'xlsx'));
}

export async function exportToPdf(options: ExportOptions) {
  const {
    entries, totalHours, currentMonth, consultantName, projectName, showConsultantColumn,
    hoursField = 'hours', rateColumns,
  } = options;
  const headers = getHeaders(showConsultantColumn, rateColumns);
  const rows = buildRows(entries, showConsultantColumn, hoursField, rateColumns);
  const horasIdx = headers.indexOf('Horas');
  rows.push(buildTotalRow(headers, entries, totalHours, hoursField, rateColumns));

  const hasExtraColumns = !!rateColumns;

  const logoDataUrl = await loadLogoAsDataUrl();

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const headerOpts: HeaderOptions = { currentMonth, logoDataUrl, consultantName, projectName };
  const startY = drawHeader(doc, pageWidth, headerOpts);


  const lastRowIndex = rows.length - 1;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    margin: { top: startY + 3, right: 14, bottom: 20, left: 14 },
    theme: 'grid',
    styles: {
      fontSize: hasExtraColumns ? 7 : 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      [headers.indexOf('Data')]: { halign: 'center', cellWidth: 22 },
      [headers.indexOf('Ticket')]: { halign: 'center', cellWidth: 28 },
      [headers.indexOf('Início')]: { halign: 'center', cellWidth: 16 },
      [headers.indexOf('Fim')]: { halign: 'center', cellWidth: 16 },
      [horasIdx]: { halign: 'right', cellWidth: 16 },
      ...(rateColumns ? {
        [headers.indexOf(CLIENT_TOTAL_HEADER)]: { halign: 'right', cellWidth: 26 },
        [headers.indexOf(CONSULTANT_TOTAL_HEADER)]: { halign: 'right', cellWidth: 26 },
      } : {}),
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === lastRowIndex) {
        data.cell.styles.fillColor = BRAND_COLOR;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 9;
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(doc, pageWidth, headerOpts);
      }
    },
  });

  const totalPages = doc.getNumberOfPages();
  const now = new Date();
  const locale = useLocaleStore.getState().locale;
  const timestamp = `Gerado em ${now.toLocaleDateString(locale)} às ${now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(timestamp, 14, pageHeight - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  doc.save(getFileName(currentMonth, consultantName, 'pdf'));
}
