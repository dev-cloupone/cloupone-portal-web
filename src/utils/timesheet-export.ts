import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TimeEntryListItem } from '../types/time-entry.types';

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

interface ExportOptions {
  entries: TimeEntryListItem[];
  totalHours: string;
  currentMonth: string;
  consultantName?: string;
  projectName?: string;
  showConsultantColumn: boolean;
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

function getHeaders(showConsultant: boolean): string[] {
  const headers = ['Data'];
  if (showConsultant) headers.push('Consultor');
  headers.push('Projeto', 'Subfase', 'Ticket', 'Inicio', 'Fim', 'Horas', 'Descricao');
  return headers;
}

function buildRows(entries: TimeEntryListItem[], showConsultant: boolean): string[][] {
  return entries.map(e => {
    const row: string[] = [formatDate(e.date)];
    if (showConsultant) row.push(e.consultantName);
    row.push(
      e.projectName,
      e.subphaseName || '-',
      e.ticketCode || '-',
      e.startTime.slice(0, 5),
      e.endTime.slice(0, 5),
      Number(e.hours).toFixed(2),
      e.description || '-',
    );
    return row;
  });
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
  const { entries, totalHours, currentMonth, consultantName, showConsultantColumn } = options;
  const headers = getHeaders(showConsultantColumn);
  const rows = buildRows(entries, showConsultantColumn);

  const totalRow = new Array(headers.length).fill('');
  const horasIdx = headers.indexOf('Horas');
  totalRow[horasIdx - 1] = 'Total:';
  totalRow[horasIdx] = totalHours;
  rows.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Apontamentos');
  XLSX.writeFile(wb, getFileName(currentMonth, consultantName, 'xlsx'));
}

export async function exportToPdf(options: ExportOptions) {
  const { entries, totalHours, currentMonth, consultantName, projectName, showConsultantColumn } = options;
  const headers = getHeaders(showConsultantColumn);
  const rows = buildRows(entries, showConsultantColumn);

  const totalRow = new Array(headers.length).fill('');
  const horasIdx = headers.indexOf('Horas');
  totalRow[horasIdx - 1] = 'Total:';
  totalRow[horasIdx] = totalHours;
  rows.push(totalRow);

  const logoDataUrl = await loadLogoAsDataUrl();

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const headerOpts: HeaderOptions = { currentMonth, logoDataUrl, consultantName, projectName };
  let startY = drawHeader(doc, pageWidth, headerOpts);


  const lastRowIndex = rows.length - 1;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    margin: { top: startY + 3, right: 14, bottom: 20, left: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8,
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
      [headers.indexOf('Inicio')]: { halign: 'center', cellWidth: 16 },
      [headers.indexOf('Fim')]: { halign: 'center', cellWidth: 16 },
      [horasIdx]: { halign: 'right', cellWidth: 16 },
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
  const timestamp = `Gerado em ${now.toLocaleDateString('pt-BR')} as ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(timestamp, 14, pageHeight - 10);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  doc.save(getFileName(currentMonth, consultantName, 'pdf'));
}
