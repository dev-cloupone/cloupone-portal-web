import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import type { TimeEntryListItem } from '../../types/time-entry.types';

interface ListTableProps {
  entries: TimeEntryListItem[];
  totalHours: string;
  loading: boolean;
  filtering: boolean;
  showConsultantColumn: boolean;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-3" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ListTable({ entries, totalHours, loading, filtering, showConsultantColumn }: ListTableProps) {
  const colCount = showConsultantColumn ? 9 : 8;

  if (loading) {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Data</TableHeader>
            {showConsultantColumn && <TableHeader>Consultor</TableHeader>}
            <TableHeader>Projeto</TableHeader>
            <TableHeader>Subfase</TableHeader>
            <TableHeader>Ticket</TableHeader>
            <TableHeader>Inicio</TableHeader>
            <TableHeader>Fim</TableHeader>
            <TableHeader>Horas</TableHeader>
            <TableHeader>Descricao</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} cols={colCount} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-text-muted transition-opacity duration-150 ${filtering ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm">Nenhum apontamento encontrado para este periodo.</p>
      </div>
    );
  }

  return (
    <Table className={`transition-opacity duration-150 ${filtering ? 'opacity-50 pointer-events-none' : ''}`}>
      <TableHead>
        <TableRow>
          <TableHeader>Data</TableHeader>
          {showConsultantColumn && <TableHeader>Consultor</TableHeader>}
          <TableHeader>Projeto</TableHeader>
          <TableHeader>Subfase</TableHeader>
          <TableHeader>Ticket</TableHeader>
          <TableHeader>Inicio</TableHeader>
          <TableHeader>Fim</TableHeader>
          <TableHeader className="text-right">Horas</TableHeader>
          <TableHeader>Descricao</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map(entry => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
            {showConsultantColumn && <TableCell>{entry.consultantName}</TableCell>}
            <TableCell>{entry.projectName}</TableCell>
            <TableCell>{entry.subphaseName || '-'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{entry.ticketCode || '-'}</TableCell>
            <TableCell className="whitespace-nowrap">{entry.startTime.slice(0, 5)}</TableCell>
            <TableCell className="whitespace-nowrap">{entry.endTime.slice(0, 5)}</TableCell>
            <TableCell className="text-right font-medium whitespace-nowrap">{Number(entry.hours).toFixed(2)}</TableCell>
            <TableCell className="max-w-[250px] truncate">{entry.description || '-'}</TableCell>
          </TableRow>
        ))}
        {/* Total row */}
        <tr className="bg-surface-2 font-semibold">
          <td colSpan={showConsultantColumn ? 7 : 6} className="px-4 py-3.5 text-sm text-text-secondary text-right">
            Total:
          </td>
          <td className="px-4 py-3.5 text-sm text-text-secondary text-right font-bold">
            {totalHours}h
          </td>
          <td className="px-4 py-3.5" />
        </tr>
      </TableBody>
    </Table>
  );
}
