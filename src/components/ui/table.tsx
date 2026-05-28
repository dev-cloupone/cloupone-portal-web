import type { ReactNode } from 'react';

interface TableProps {
  children?: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-border bg-surface-1 ${className}`}>
      <table className="min-w-full divide-y divide-border">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-2">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-subtle">{children}</tbody>;
}

interface TableRowProps extends TableProps {
  onClick?: () => void;
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return <tr className={`transition-colors hover:bg-surface-2/50 ${className}`} onClick={onClick}>{children}</tr>;
}

interface TableCellProps extends TableProps {
  colSpan?: number;
}

export function TableHeader({ children, className = '', colSpan }: TableCellProps) {
  return (
    <th colSpan={colSpan} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', colSpan }: TableCellProps) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3.5 text-sm text-text-secondary ${className}`}>
      {children}
    </td>
  );
}
