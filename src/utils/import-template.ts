import * as XLSX from 'xlsx';

export function downloadImportTemplate(): void {
  const headers = ['Data', 'Projeto', 'Subfase', 'Ticket', 'Início', 'Fim', 'Descrição'];
  const example = ['02/06/2026', 'Nome do Projeto', 'Nome da Subfase', 'TK-001', '09:00', '18:00', 'Descrição do trabalho realizado'];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'template-apontamentos.xlsx');
}
