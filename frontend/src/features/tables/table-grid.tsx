'use client';

import { useTableStore } from '@/stores/table-store';
import { TableCard } from './table-card';
import type { Table } from '@/types/table';

interface TableGridProps {
  onTableSelect: (table: Table) => void;
}

export function TableGrid({ onTableSelect }: TableGridProps) {
  const tables = useTableStore((state) => state.tables);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} onSelect={onTableSelect} />
      ))}
    </div>
  );
}
